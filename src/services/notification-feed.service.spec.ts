import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { NotificationFeedService } from './notification-feed.service';
import { AuthService } from './AuthService.service';
import { environment } from '../environments/environment';
import { AppNotification, NotificationList } from '../models/notification.model';

describe('NotificationFeedService', () => {
  let service: NotificationFeedService;
  let httpMock: HttpTestingController;

  const originalUserAgent = navigator.userAgent;
  const originalPlatform = navigator.platform;
  const originalMaxTouchPoints = navigator.maxTouchPoints;
  const originalStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  const originalPushManager = (window as Window & { PushManager?: unknown }).PushManager;
  const originalNotification = (window as Window & { Notification?: unknown }).Notification;
  const originalServiceWorker = (navigator as Navigator & { serviceWorker?: unknown }).serviceWorker;
  const originalMatchMedia = window.matchMedia;

  const apiUrl = `${environment.origin}api/Notifications`;

  const makeNotification = (overrides: Partial<AppNotification> = {}): AppNotification => ({
    id: 1,
    title: 'Purchase Invoice Requires Approval',
    message: 'Purchase Invoice PI-000152 submitted by Ahmed and requires your approval.',
    type: 'Approval',
    priority: 'High',
    status: 'Active',
    userId: 10,
    referenceId: 1205,
    referenceType: 'PurchaseInvoice',
    documentNo: 'PI-000152',
    url: '/purchases/purchase-invoice/view/1205',
    isRead: false,
    createdDate: new Date().toISOString(),
    icon: 'approval',
    ...overrides,
  });

  const makeList = (items: AppNotification[], unreadCount: number): NotificationList => ({
    items,
    totalCount: items.length,
    unreadCount,
    page: 1,
    pageSize: 20,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Signed out by default: startRealtime() must be a no-op without a token.
        { provide: AuthService, useValue: { getToken: () => null } },
      ],
    });

    service = TestBed.inject(NotificationFeedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUserAgent });
    Object.defineProperty(navigator, 'platform', { configurable: true, value: originalPlatform });
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: originalMaxTouchPoints });
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: originalStandalone });
    Object.defineProperty(window, 'PushManager', { configurable: true, value: originalPushManager });
    Object.defineProperty(window, 'Notification', { configurable: true, value: originalNotification });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: originalServiceWorker });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  });

  describe('loadNotifications', () => {
    it('populates the list and unread count from the response envelope', () => {
      service.loadNotifications().subscribe();

      const request = httpMock.expectOne(r => r.url === apiUrl);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get('page')).toBe('1');
      expect(request.request.params.get('pageSize')).toBe('20');
      // The unreadOnly flag is omitted rather than sent as false.
      expect(request.request.params.has('unreadOnly')).toBe(false);

      request.flush({ success: true, message: '', data: makeList([makeNotification()], 3) });

      expect(service.notifications().length).toBe(1);
      expect(service.unreadCount()).toBe(3);
      expect(service.hasUnread()).toBe(true);
      expect(service.loading()).toBe(false);
    });

    it('passes unreadOnly through when requested', () => {
      service.loadNotifications(1, 20, true).subscribe();

      const request = httpMock.expectOne(r => r.url === apiUrl);
      expect(request.request.params.get('unreadOnly')).toBe('true');
      request.flush({ success: true, message: '', data: makeList([], 0) });
    });

    it('clears the loading flag when the request fails', () => {
      service.loadNotifications().subscribe({ error: () => undefined });

      httpMock.expectOne(r => r.url === apiUrl).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(service.loading()).toBe(false);
    });
  });

  describe('refreshUnreadCount', () => {
    it('updates only the badge', () => {
      service.refreshUnreadCount().subscribe();

      httpMock.expectOne(`${apiUrl}/unread-count`).flush({ success: true, message: '', data: 7 });

      expect(service.unreadCount()).toBe(7);
      expect(service.notifications()).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('updates the row and badge optimistically, then applies the server count', () => {
      service.loadNotifications().subscribe();
      httpMock
        .expectOne(r => r.url === apiUrl)
        .flush({ success: true, message: '', data: makeList([makeNotification({ id: 5 })], 2) });

      service.markAsRead(5).subscribe();

      // Optimistic: applied before the response arrives.
      expect(service.notifications()[0].isRead).toBe(true);
      expect(service.unreadCount()).toBe(1);

      httpMock.expectOne(`${apiUrl}/5/read`).flush({ success: true, message: '', data: 1 });

      expect(service.unreadCount()).toBe(1);
    });

    it('re-syncs the badge from the server when the request fails', () => {
      service.loadNotifications().subscribe();
      httpMock
        .expectOne(r => r.url === apiUrl)
        .flush({ success: true, message: '', data: makeList([makeNotification({ id: 5 })], 2) });

      service.markAsRead(5).subscribe({ error: () => undefined });
      httpMock.expectOne(`${apiUrl}/5/read`).flush('nope', { status: 404, statusText: 'Not Found' });

      // A rollback fetch is issued so the optimistic decrement can't strand the badge.
      httpMock.expectOne(`${apiUrl}/unread-count`).flush({ success: true, message: '', data: 2 });
      expect(service.unreadCount()).toBe(2);
    });

    it('does not decrement twice for an already-read notification', () => {
      service.loadNotifications().subscribe();
      httpMock
        .expectOne(r => r.url === apiUrl)
        .flush({ success: true, message: '', data: makeList([makeNotification({ id: 5, isRead: true })], 1) });

      service.markAsRead(5).subscribe();

      expect(service.unreadCount()).toBe(1);
      httpMock.expectOne(`${apiUrl}/5/read`).flush({ success: true, message: '', data: 1 });
    });
  });

  describe('markAllAsRead', () => {
    it('marks every row read and zeroes the badge', () => {
      service.loadNotifications().subscribe();
      httpMock.expectOne(r => r.url === apiUrl).flush({
        success: true,
        message: '',
        data: makeList([makeNotification({ id: 1 }), makeNotification({ id: 2 })], 2),
      });

      service.markAllAsRead().subscribe();
      httpMock.expectOne(`${apiUrl}/read-all`).flush({ success: true, message: '', data: 2 });

      expect(service.unreadCount()).toBe(0);
      expect(service.notifications().every(n => n.isRead)).toBe(true);
    });
  });

  describe('realtime payloads', () => {
    /** Invokes the private SignalR handler, which is what the hub callback ultimately calls. */
    const receive = (notification: AppNotification, unreadCount: number) =>
      (service as unknown as {
        onNotificationReceived: (p: { notification: AppNotification; unreadCount: number; timestamp: string }) => void;
      }).onNotificationReceived({ notification, unreadCount, timestamp: new Date().toISOString() });

    it('prepends the new notification and takes the server unread count', () => {
      service.loadNotifications().subscribe();
      httpMock
        .expectOne(r => r.url === apiUrl)
        .flush({ success: true, message: '', data: makeList([makeNotification({ id: 1 })], 1) });

      receive(makeNotification({ id: 2, title: 'Newer' }), 2);

      expect(service.notifications()[0].id).toBe(2);
      expect(service.notifications().length).toBe(2);
      expect(service.unreadCount()).toBe(2);
    });

    it('does not duplicate a notification that arrives twice', () => {
      receive(makeNotification({ id: 9 }), 1);
      receive(makeNotification({ id: 9 }), 1);

      expect(service.notifications().length).toBe(1);
      expect(service.unreadCount()).toBe(1);
    });
  });

  describe('startRealtime', () => {
    it('does nothing while signed out', async () => {
      await service.startRealtime();
      expect(service.connected()).toBe(false);
    });
  });

  describe('registerPush', () => {
    it('silently skips on iOS Safari when not installed as a PWA', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      });
      Object.defineProperty(navigator, 'platform', { configurable: true, value: 'iPhone' });
      Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
      Object.defineProperty(navigator, 'standalone', { configurable: true, value: false });
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: () => ({ matches: false, media: '', onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false }),
      });

      Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} });
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        value: { permission: 'default', requestPermission: () => Promise.resolve('granted') },
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { register: () => Promise.resolve(undefined), ready: Promise.resolve(undefined) },
      });

      const result = await service.registerPush();

      expect(result).toBe(false);
      httpMock.expectNone(`${apiUrl}/vapid-public-key`);
      httpMock.expectNone(`${apiUrl}/push-subscription`);
    });

    it('skips when Notification API is unavailable', async () => {
      Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} });
      Object.defineProperty(window, 'Notification', { configurable: true, value: undefined });

      const result = await service.registerPush();

      expect(result).toBe(false);
      httpMock.expectNone(`${apiUrl}/vapid-public-key`);
    });
  });
});
