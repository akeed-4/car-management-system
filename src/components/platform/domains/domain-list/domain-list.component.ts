import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { DomainDto } from '../../../../models/platform/domain.model';
import { dataGridColumnDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-domain-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, TranslateModule, SharedDataGridComponent],
  templateUrl: './domain-list.component.html',
  styleUrl: './domain-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainListComponent {
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  domains = signal<DomainDto[]>([]);

  /** Config-driven columns -- SSL renders as a boolean icon; verification as a badge. */
  columns: dataGridColumnDto[] = [
    { dataField: 'domainName', dataType: 'string', caption: 'PLATFORM.DOMAINS.HOSTNAME' },
    { dataField: 'hasSsl', dataType: 'boolean', caption: 'PLATFORM.DOMAINS.SSL', width: 100, type: 'check', allowSorting: false, allowFiltering: false },
    { dataField: 'tenantName', dataType: 'string', caption: 'PLATFORM.DOMAINS.TENANT' },
    {
      dataField: 'isVerified',
      dataType: 'boolean',
      caption: 'PLATFORM.DOMAINS.STATUS',
      width: 130,
      type: 'status',
      allowSorting: false,
      trueText: 'PLATFORM.DOMAINS.VERIFIED',
      falseText: 'PLATFORM.DOMAINS.PENDING',
    },
    { dataField: 'createdAt', dataType: 'date', format: 'yyyy-MM-dd', caption: 'PLATFORM.DOMAINS.CREATED' },
  ];


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
