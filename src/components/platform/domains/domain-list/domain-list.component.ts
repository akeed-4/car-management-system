import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { DomainDto } from '../../../../models/platform/domain.model';
import { dataGridColumnDto } from '../../../../models/grid.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';

@Component({
  selector: 'app-domain-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, TranslateModule, SharedDataGridComponent, SharedMobileListComponent],
  templateUrl: './domain-list.component.html',
  styleUrl: './domain-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainListComponent {
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  private responsiveService = inject(ResponsiveService);
  private translate = inject(TranslateService);
  isMobile = this.responsiveService.isMobile;

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

  /** Same field set as the desktop grid's visible columns, for the mobile card list. */
  mobileFields: MobileListFieldDto<DomainDto>[] = [
    { label: 'PLATFORM.DOMAINS.TENANT', value: (d) => d.tenantName },
    {
      label: 'PLATFORM.DOMAINS.SSL',
      value: (d) => this.translate.instant(d.hasSsl ? 'COMMON.YES' : 'COMMON.NO'),
    },
    {
      label: 'PLATFORM.DOMAINS.STATUS',
      value: (d) => this.translate.instant(d.isVerified ? 'PLATFORM.DOMAINS.VERIFIED' : 'PLATFORM.DOMAINS.PENDING'),
      type: 'status',
      statusClass: (d) => (d.isVerified ? 'success' : 'warning'),
    },
    { label: 'PLATFORM.DOMAINS.CREATED', value: (d) => d.createdAt, type: 'date' },
  ];

  mobileTitleOf = (d: DomainDto) => d.domainName;
  mobileTrackBy = (index: number, d: DomainDto) => d.id ?? index;

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
