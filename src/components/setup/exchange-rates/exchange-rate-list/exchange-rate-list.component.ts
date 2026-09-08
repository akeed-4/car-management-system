import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { ExchangeRateService } from '../../../../services/exchange-rate.service';
import { NotificationService } from '../../../../services/notification.service';
import { CurrencyExchangeRate } from '../../../../models/exchange-rate.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';

@Component({
  selector: 'app-exchange-rate-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslateModule,
    SharedDataGridComponent,
    HasPermissionDirective,
    SharedMobileListComponent
  ],
  templateUrl: './exchange-rate-list.component.html',
  styleUrls: ['./exchange-rate-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExchangeRateListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private exchangeRateService = inject(ExchangeRateService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  rates = signal<CurrencyExchangeRate[]>([]);
  loading = signal(false);
  mobileSearch = signal('');

  /** Client-side search for the mobile card list (desktop keeps DevExtreme's own search panel). */
  filteredRates = computed(() => {
    const term = this.mobileSearch().toLowerCase();
    const rates = this.rates();
    if (!term) return rates;
    return rates.filter(r =>
      r.fromCurrencyCode?.toLowerCase().includes(term) ||
      r.toCurrencyCode?.toLowerCase().includes(term)
    );
  });

  /** Config-driven columns -- newest effective date first (as before). */
  columns: dataGridColumnDto[] = [
    { dataField: 'fromCurrencyCode', dataType: 'string', caption: 'EXCHANGE_RATE.FROM_CURRENCY', width: 120 },
    { dataField: 'toCurrencyCode', dataType: 'string', caption: 'EXCHANGE_RATE.TO_CURRENCY', width: 120 },
    { dataField: 'rate', dataType: 'number', format: '#0.######', caption: 'EXCHANGE_RATE.RATE', width: 120 },
    { dataField: 'effectiveDate', dataType: 'date', caption: 'EXCHANGE_RATE.EFFECTIVE_DATE', width: 140, sortOrder: 'desc' },
    { dataField: 'isActive', dataType: 'boolean', caption: 'COMMON.ACTIVE', width: 110, type: 'status' },
  ];

  /** Row actions -- same edit/delete behavior via the shared actions template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('exchangerates.view') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('exchangerates.view') },
  ];

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }

  /** Same field set as the desktop grid's visible columns, for the mobile card list. */
  mobileFields: MobileListFieldDto<CurrencyExchangeRate>[] = [
    { label: 'EXCHANGE_RATE.RATE', value: (r) => r.rate },
    { label: 'EXCHANGE_RATE.EFFECTIVE_DATE', value: (r) => r.effectiveDate, type: 'date' },
    {
      label: 'COMMON.ACTIVE',
      value: (r) => this.translate.instant(r.isActive ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE'),
      type: 'status',
      statusClass: (r) => (r.isActive ? 'success' : 'neutral'),
    },
  ];

  /** Same edit/delete actions as the desktop grid's row actions. */
  mobileActions: MobileListActionDto<CurrencyExchangeRate>[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('exchangerates.view') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('exchangerates.view') },
  ];

  mobileTitleOf = (r: CurrencyExchangeRate) => `${r.fromCurrencyCode} -> ${r.toCurrencyCode}`;
  mobileTrackBy = (index: number, r: CurrencyExchangeRate) => r.id ?? index;

  onMobileAction(e: MobileListActionEvent<CurrencyExchangeRate>): void {
    const wrapped = { row: { data: e.item } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }


  ngOnInit(): void {
    this.loadRates();
  }

  loadRates(): void {
    this.loading.set(true);
    this.exchangeRateService.getAll().subscribe({
      next: (data) => {
        this.rates.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('EXCHANGE_RATE.LOAD_ERROR'));
      }
    });
  }

  refresh(): void {
    this.loadRates();
  }

  onCreate(): void {
    this.router.navigate(['/setup/exchange-rates/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/setup/exchange-rates/edit', e.row.data.id]);
  };

  onDelete = (e: any): void => {
    const rate: CurrencyExchangeRate = e.row.data;
    const message = this.translate.instant('EXCHANGE_RATE.CONFIRM_DELETE', {
      pair: `${rate.fromCurrencyCode} -> ${rate.toCurrencyCode}`
    });
    if (!confirm(message)) return;

    this.exchangeRateService.delete(rate.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('EXCHANGE_RATE.DELETE_SUCCESS'));
        this.loadRates();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('EXCHANGE_RATE.DELETE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ExchangeRates');
        exportDataGrid({ component: this.grid.getInstance(), worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'ExchangeRates.xlsx');
            });
          });
        });
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
