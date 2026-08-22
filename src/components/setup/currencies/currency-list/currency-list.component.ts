import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyService } from '../../../../services/currency.service';
import { NotificationService } from '../../../../services/notification.service';
import { Currency } from '../../../../models/currency.model';

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
    DxDataGridModule,
    DxTemplateModule,
    TranslateModule
  ],
  templateUrl: './currency-list.component.html',
  styleUrls: ['./currency-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrencyListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private currencyService = inject(CurrencyService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  currencies = signal<Currency[]>([]);
  loading = signal(false);

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
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
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
