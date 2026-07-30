import { Injectable, NgZone, computed, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Observable, firstValueFrom } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { AuthService } from './AuthService.service';
import {
  AppNotification,
  NotificationApiResponse,
  NotificationList,
  NotificationPushPayload,
} from '../models/notification.model';

/**
 * The persisted notification feed behind the header bell: REST reads, a live SignalR stream, and
 * Web Push registration.
 *
 * Deliberately named `NotificationFeedService` rather than `NotificationService` — the latter
 * already exists in this codebase as the toast/confirm-dialog wrapper (see notification.service.ts)
 * and is injected in many components. These are different concerns and both are kept.
 */
@Injectable({ providedIn: 'root' })
export class NotificationFeedService {
  private readonly apiUrl = `${environment.origin}api/Notifications`;
  /** Must match app.MapHub<NotificationHub>("/hubs/notifications") in Program.cs. */
  private readonly hubUrl = `${environment.origin}hubs/notifications`;

  private hubConnection?: HubConnection;
  private pushSubscribed = false;

  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal(0);
  private readonly _loading = signal(false);
  private readonly _connected = signal(false);

  /** Most recent notifications, newest first. */
  readonly notifications = this._notifications.asReadonly();
  /** Unread badge count. */
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly loading = this._loading.asReadonly();
  /** True while the SignalR stream is live; the UI falls back to polling-on-open when false. */
  readonly connected = this._connected.asReadonly();
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private zone: NgZone,
  ) {}

  // ==================== REST ====================

  /**
   * Loads a page of the feed and replaces the in-memory list. Page 1 is what the bell shows.
   */
  loadNotifications(page = 1, pageSize = 20, unreadOnly = false): Observable<NotificationList> {
    this._loading.set(true);

    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    if (unreadOnly) {
      params = params.set('unreadOnly', true);
    }

    return this.http
      .get<NotificationApiResponse<NotificationList>>(this.apiUrl, { params })
      .pipe(
        map(response => response.data),
        tap({
          next: list => {
            this._notifications.set(list.items ?? []);
            this._unreadCount.set(list.unreadCount ?? 0);
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  /** Refreshes just the badge, without pulling the list. */
  refreshUnreadCount(): Observable<number> {
    return this.http
      .get<NotificationApiResponse<number>>(`${this.apiUrl}/unread-count`)
      .pipe(
        map(response => response.data ?? 0),
        tap(count => this._unreadCount.set(count)),
      );
  }

  /**
   * Marks one notification read. The local row and badge are updated optimistically so the UI
   * responds instantly; the server's authoritative count replaces the optimistic one on reply.
   */
  markAsRead(id: number): Observable<number> {
    const wasUnread = this._notifications().find(n => n.id === id)?.isRead === false;
    if (wasUnread) {
      this.applyReadLocally(id);
    }

    return this.http
      .post<NotificationApiResponse<number>>(`${this.apiUrl}/${id}/read`, {})
      .pipe(
        map(response => response.data ?? 0),
        tap({
          next: count => this._unreadCount.set(count),
          // Roll the optimistic update back if the server rejected it, so the badge can't drift
          // permanently out of sync with the stored state.
          error: () => this.refreshUnreadCount().subscribe({ error: () => undefined }),
        }),
      );
  }

  /** Marks every unread notification read. */
  markAllAsRead(): Observable<number> {
    return this.http
      .post<NotificationApiResponse<number>>(`${this.apiUrl}/read-all`, {})
      .pipe(
        map(response => response.data ?? 0),
        tap(() => {
          const now = new Date().toISOString();
          this._notifications.update(items =>
            items.map(n => (n.isRead ? n : { ...n, isRead: true, readDate: now })),
          );
          this._unreadCount.set(0);
        }),
      );
  }

  private applyReadLocally(id: number): void {
    const now = new Date().toISOString();
    this._notifications.update(items =>
      items.map(n => (n.id === id ? { ...n, isRead: true, readDate: now } : n)),
    );
    this._unreadCount.update(count => (count > 0 ? count - 1 : 0));
  }

  // ==================== SignalR ====================

  /**
   * Opens the real-time stream. Safe to call repeatedly — a connection that already exists is
   * left alone. Silent no-op when the user isn't signed in.
   */
  async startRealtime(): Promise<void> {
    if (this.hubConnection || !this.authService.getToken()) {
      return;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        // The token is read lazily on every (re)connect rather than captured once, so a
        // reconnect after a token refresh uses the new token instead of a stale one.
        accessTokenFactory: () => this.authService.getToken() ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // SignalR callbacks fire outside Angular's zone; signals still update, but running inside the
    // zone keeps change detection prompt for OnPush components bound to them.
    connection.on('ReceiveNotification', (payload: NotificationPushPayload) => {
      this.zone.run(() => this.onNotificationReceived(payload));
    });

    connection.onreconnected(() => {
      this.zone.run(() => {
        this._connected.set(true);
        // Anything delivered while the socket was down was still persisted server-side, so
        // re-sync the badge rather than assuming the local count is still correct.
        this.refreshUnreadCount().subscribe({ error: () => undefined });
      });
    });

    connection.onclose(() => this.zone.run(() => this._connected.set(false)));
    connection.onreconnecting(() => this.zone.run(() => this._connected.set(false)));

    this.hubConnection = connection;

    try {
      await connection.start();
      this._connected.set(true);
    } catch {
      // A failed socket is not fatal: notifications are persisted, so the bell still shows them
      // on open. Automatic reconnect keeps trying in the background.
      this._connected.set(false);
    }
  }

  /** Closes the stream and clears cached state — call on logout. */
  async stopRealtime(): Promise<void> {
    const connection = this.hubConnection;
    this.hubConnection = undefined;
    this._connected.set(false);

    if (connection && connection.state !== HubConnectionState.Disconnected) {
      try {
        await connection.stop();
      } catch {
        // Already closing/closed — nothing to do.
      }
    }

    this._notifications.set([]);
    this._unreadCount.set(0);
    this.pushSubscribed = false;
  }

  private onNotificationReceived(payload: NotificationPushPayload): void {
    if (!payload?.notification) return;

    this._notifications.update(items => {
      // The same notification can arrive twice (e.g. a reconnect replays it); key on id so the
      // list never shows duplicates.
      const withoutDuplicate = items.filter(n => n.id !== payload.notification.id);
      return [payload.notification, ...withoutDuplicate];
    });

    // The server's count is authoritative — it accounts for everything, not just this session.
    this._unreadCount.set(payload.unreadCount);
  }

  // ==================== Web Push ====================

  /**
   * Registers this browser for push, if the user grants permission.
   *
   * Every step is optional and degrades quietly: unsupported browser, push not configured on the
   * server, or a denied prompt all leave in-app SignalR notifications fully working.
   */
  async registerPush(): Promise<boolean> {
    if (this.pushSubscribed) return true;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const publicKey = await firstValueFrom(
        this.http
          .get<NotificationApiResponse<string | null>>(`${this.apiUrl}/vapid-public-key`)
          .pipe(map(response => response.data)),
      );

      // Push is switched off server-side (no VAPID keys configured).
      if (!publicKey) return false;

      const registration = await navigator.serviceWorker.register('/notification-sw.js');
      await navigator.serviceWorker.ready;

      // Never re-prompt: 'denied' is sticky and calling subscribe() again would just throw.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          // Required by Chrome: it refuses subscriptions that can't show a visible notification.
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicKey),
        }));

      const json = subscription.toJSON();
      await firstValueFrom(
        this.http.post<NotificationApiResponse<boolean>>(`${this.apiUrl}/push-subscription`, {
          endpoint: subscription.endpoint,
          p256dh: json.keys?.['p256dh'] ?? '',
          auth: json.keys?.['auth'] ?? '',
        }),
      );

      this.pushSubscribed = true;
      return true;
    } catch {
      // Push is a progressive enhancement — a failure here must never break the shell.
      return false;
    }
  }

  /** Unregisters this browser's push endpoint. Best-effort. */
  async unregisterPush(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration('/notification-sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) return;

      const params = new HttpParams().set('endpoint', subscription.endpoint);
      await firstValueFrom(
        this.http.delete<NotificationApiResponse<boolean>>(`${this.apiUrl}/push-subscription`, { params }),
      );
      await subscription.unsubscribe();
      this.pushSubscribed = false;
    } catch {
      // Nothing actionable — the endpoint is pruned server-side on its next failed delivery.
    }
  }

  /**
   * Converts a base64url VAPID key into the Uint8Array `pushManager.subscribe()` requires.
   * (The Push API predates base64url support in atob, hence the manual padding/translation.)
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      output[i] = raw.charCodeAt(i);
    }
    return output;
  }
}
