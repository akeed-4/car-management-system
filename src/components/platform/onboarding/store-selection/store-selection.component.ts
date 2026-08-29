import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { StoreContextService } from '../../../../services/store-context.service';
import { NotificationService } from '../../../../services/notification.service';
import { StoreMembershipDto } from '../../../../models/platform/store-membership.model';

/** Shown once, immediately after login, only when the caller has 2+ stores to choose from --
 *  storeSelectedGuard sends single-store and zero-store users straight past this screen. Store is
 *  the user-facing "Showroom" concept in this system; Branch (which Store belongs to) is resolved
 *  silently underneath and never gets its own picker. */
@Component({
  selector: 'app-store-selection',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule, MatIconModule, TranslateModule],
  templateUrl: './store-selection.component.html',
  styleUrl: './store-selection.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreSelectionComponent {
  private storeContext = inject(StoreContextService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  selectingStoreId = signal<number | null>(null);
  stores = signal<StoreMembershipDto[]>([]);

  constructor() {
    this.storeContext.loadMemberships().subscribe({
      next: (stores) => {
        this.stores.set(stores);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.showError('ONBOARDING.STORE_SELECTION.LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  select(store: StoreMembershipDto): void {
    this.selectingStoreId.set(store.storeId);
    this.storeContext.selectStore(store.storeId).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/dashboard');
      },
      error: () => {
        this.notificationService.showError('ONBOARDING.STORE_SELECTION.SELECT_ERROR');
        this.selectingStoreId.set(null);
      },
    });
  }
}
