import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { StoreContextService } from '../../../services/store-context.service';
import { NotificationService } from '../../../services/notification.service';
import { StoreMembershipDto } from '../../../models/platform/store-membership.model';

/**
 * Always-visible "Current Showroom" indicator for the top navbar -- the one normal place a user
 * changes their working Store after login (see storeSelectedGuard/StoreSelectionComponent for the
 * once-after-login flow). Mirrors CompanySwitcherComponent one level up the hierarchy. When the
 * user has access to more than one store (StoreContextService.hasMultipleStores()), it renders as
 * a dropdown trigger so they can switch; otherwise it's a static, non-interactive chip.
 * Memberships are already loaded into StoreContextService by storeSelectedGuard before the app
 * shell (and this component) ever renders -- no extra fetch needed here.
 */
@Component({
  selector: 'app-store-switcher',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './store-switcher.component.html',
  styleUrl: './store-switcher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreSwitcherComponent {
  private storeContext = inject(StoreContextService);
  private notificationService = inject(NotificationService);

  switching = signal(false);

  current = this.storeContext.current;
  memberships = this.storeContext.memberships;
  hasMultipleStores = this.storeContext.hasMultipleStores;

  switchTo(store: StoreMembershipDto): void {
    if (store.storeId === this.current()?.storeId || this.switching()) return;

    this.switching.set(true);
    this.storeContext.selectStore(store.storeId).subscribe({
      next: () => {
        // Full reload, not router.navigate -- switching stores needs every already-loaded
        // widget/inventory/document list to refetch under the new store, including on the
        // (common) case where the user is already sitting on a screen that wouldn't otherwise
        // re-trigger anything. Same pattern CompanySwitcherComponent already uses.
        window.location.href = '/dashboard';
      },
      error: () => {
        this.switching.set(false);
        this.notificationService.showError('LAYOUT.STORE_SWITCHER.SWITCH_ERROR');
      },
    });
  }
}
