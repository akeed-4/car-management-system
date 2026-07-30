import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NotificationFeedService } from '../../../../services/notification-feed.service';
import { AppNotification, NotificationPriority } from '../../../../models/notification.model';

/** A day-bucketed group of notifications, as rendered in the panel. */
interface NotificationGroup {
  /** Translation key for the bucket heading. */
  labelKey: string;
  items: AppNotification[];
}

/**
 * The notification panel behind the header bell — now bound to the real feed
 * (`NotificationFeedService`) rather than the placeholder empty state it used to render.
 *
 * Reads live signals directly instead of taking the list as an input, so a notification arriving
 * over SignalR updates the open panel without the shell having to relay it.
 */
@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, TranslateModule],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent implements OnChanges {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  readonly notifications = this.feed.notifications;
  readonly unreadCount = this.feed.unreadCount;
  readonly loading = this.feed.loading;

  constructor(
    private feed: NotificationFeedService,
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Refresh on open so the panel is correct even if the SignalR stream was down while closed.
    if (changes['open']?.currentValue === true) {
      this.feed.loadNotifications().subscribe({ error: () => undefined });
    }
  }

  close(): void {
    this.openChange.emit(false);
  }

  /**
   * Buckets the feed into Today / Yesterday / Earlier. Ordering within each bucket is the
   * newest-first order the server returned.
   */
  get groups(): NotificationGroup[] {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    for (const notification of this.notifications()) {
      const created = new Date(notification.createdDate);
      if (created >= startOfToday) {
        today.push(notification);
      } else if (created >= startOfYesterday) {
        yesterday.push(notification);
      } else {
        earlier.push(notification);
      }
    }

    return [
      { labelKey: 'notifications.today', items: today },
      { labelKey: 'notifications.yesterday', items: yesterday },
      { labelKey: 'notifications.earlier', items: earlier },
    ].filter(group => group.items.length > 0);
  }

  /**
   * Marks the notification read and navigates to the document it references — the two things a
   * click is expected to do. Navigation is not gated on the read call succeeding.
   */
  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.feed.markAsRead(notification.id).subscribe({ error: () => undefined });
    }

    if (notification.url) {
      this.router.navigateByUrl(notification.url);
      this.close();
    }
  }

  markAllAsRead(event: Event): void {
    // The button sits inside the panel header, not on a row — don't let it trigger a row click.
    event.stopPropagation();
    this.feed.markAllAsRead().subscribe({ error: () => undefined });
  }

  /** Material icon for a row, falling back when the server didn't supply one. */
  iconFor(notification: AppNotification): string {
    return notification.icon || 'notifications';
  }

  /** CSS modifier class driving the row's priority accent colour. */
  priorityClass(priority: NotificationPriority): string {
    return `notif-priority-${priority.toLowerCase()}`;
  }

  /**
   * Compact relative age ("5m", "3h", "2d"). Falls back to a locale date once a notification is
   * more than a week old, where a relative figure stops being useful.
   */
  relativeTime(createdDate: string): string {
    const created = new Date(createdDate).getTime();
    if (Number.isNaN(created)) return '';

    const seconds = Math.floor((Date.now() - created) / 1000);

    if (seconds < 60) return this.translate.instant('notifications.justNow');
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${this.translate.instant('notifications.minuteShort')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${this.translate.instant('notifications.hourShort')}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}${this.translate.instant('notifications.dayShort')}`;

    return new Date(createdDate).toLocaleDateString(this.translate.currentLang || 'en');
  }

  /** Stable identity so an incoming notification doesn't re-render the whole list. */
  trackById(_index: number, notification: AppNotification): number {
    return notification.id;
  }
}
