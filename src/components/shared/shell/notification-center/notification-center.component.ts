import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/** UI shell only -- there is no persisted notification feed in the backend today
 *  (NotificationService is a toast/confirm-dialog wrapper, not a data source with a list/read
 *  state). This renders the panel and a real empty state rather than fabricating sample
 *  notifications, so it's honest about not being wired to live data yet. Once a real
 *  notifications endpoint exists, swap the empty state for a list bound to that service --
 *  the panel shell itself doesn't need to change. */
@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  close(): void {
    this.openChange.emit(false);
  }
}
