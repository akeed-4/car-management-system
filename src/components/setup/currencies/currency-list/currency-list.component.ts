import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
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
import { CurrencyService } from '../../../../services/currency.service';
import { NotificationService } from '../../../../services/notification.service';
import { Currency } from '../../../../models/currency.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';

@Component({
  selector: 'app-currency-list',
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
    HasPermissionDirective
  ],
  templateUrl: './currency-list.component.html',
  styleUrls: ['./currency-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrencyListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private currencyService = inject(CurrencyService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);

  currencies = signal<Currency[]>([]);
  loading = signal(false);

  /** Config-driven columns for the Shared DataGrid (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'code', dataType: 'string', caption: 'CURRENCY.CODE', width: 100 },
    { dataField: 'nameEn', dataType: 'string', caption: 'CURRENCY.NAME_ENGLISH' },
    { dataField: 'nameAr', dataType: 'string', caption: 'CURRENCY.NAME_ARABIC' },
    { dataField: 'symbol', dataType: 'string', caption: 'CURRENCY.SYMBOL', width: 100 },
    { dataField: 'decimalPlaces', dataType: 'number', caption: 'CURRENCY.DECIMAL_PLACES', width: 130 },
    { dataField: 'isActive', dataType: 'boolean', caption: 'COMMON.ACTIVE', width: 110, type: 'status' },
  ];

  /** Row actions -- deactivate renders disabled for already-inactive rows. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('currencies.view') },
    {
      id: 'deactivate',
      icon: 'block',
      labelKey: 'CURRENCY.DEACTIVATE',
      cssClass: 'warn',
      disabled: (row) => !row.isActive,
      visible: () => this.permissionService.hasPermission('currencies.view'),
    },
  ];

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'deactivate') this.onDeactivate(wrapped);
  }


  ngOnInit(): void {
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.loading.set(true);
    this.currencyService.getAll().subscribe({
      next: (data) => {
        this.currencies.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('CURRENCY.LOAD_ERROR'));
      }
    });
  }

  refresh(): void {
    this.loadCurrencies();
  }

  onCreate(): void {
    this.router.navigate(['/setup/currencies/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/setup/currencies/edit', e.row.data.id]);
  };

  /** Deactivates the currency -- currencies are never physically deleted. */
  onDeactivate = (e: any): void => {
    const currency: Currency = e.row.data;
    if (!currency.isActive) return;

    const message = this.translate.instant('CURRENCY.CONFIRM_DEACTIVATE', { code: currency.code });
    if (!confirm(message)) return;

    this.currencyService.delete(currency.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('CURRENCY.DEACTIVATE_SUCCESS'));
        this.loadCurrencies();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('CURRENCY.DEACTIVATE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Currencies');
        exportDataGrid({ component: this.grid.getInstance(), worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Currencies.xlsx');
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
