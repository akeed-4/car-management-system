import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { DomainDto } from '../../../../models/platform/domain.model';

@Component({
  selector: 'app-domain-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, DxDataGridModule, TranslateModule],
  templateUrl: './domain-list.component.html',
  styleUrl: './domain-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainListComponent {
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  domains = signal<DomainDto[]>([]);

  constructor() {
    this.loadDomains();
  }

  private loadDomains(): void {
    this.loading.set(true);
    this.platformService.getDomains().subscribe({
      next: (domains) => {
        this.domains.set(domains);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.showError('TOAST.LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.loadDomains();
  }
}
