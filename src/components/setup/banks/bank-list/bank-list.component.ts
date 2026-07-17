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
import { BankService } from '../../../../services/bank.service';
import { NotificationService } from '../../../../services/notification.service';
import { Bank } from '../../../../models/bank.model';
import { HasPermissionDirective } from '../../../shared/permission.directive';

@Component({
  selector: 'app-bank-management-list',
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
    TranslateModule,
    HasPermissionDirective
  ],
  templateUrl: './bank-list.component.html',
  styleUrls: ['./bank-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankManagementListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private bankService = inject(BankService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  banks = signal<Bank[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadBanks();
  }

  loadBanks(): void {
    this.loading.set(true);
    this.bankService.getAll().subscribe({
      next: (data) => {
        this.banks.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('BANK.LOAD_ERROR'));
      }
    });
  }

  refresh(): void {
    this.loadBanks();
  }

  onCreate(): void {
    this.router.navigate(['/setup/banks/new']);
  }

  onView = (e: any): void => {
    this.router.navigate(['/setup/banks/view', e.row.data.id]);
  };

  onEdit = (e: any): void => {
    this.router.navigate(['/setup/banks/edit', e.row.data.id]);
  };

  onDelete = (e: any): void => {
    const bank: Bank = e.row.data;
    const message = this.translate.instant('BANK.CONFIRM_DELETE', { code: bank.bankCode });
    if (!confirm(message)) return;

    this.bankService.delete(bank.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('BANK.DELETE_SUCCESS'));
        this.loadBanks();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('BANK.DELETE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Banks');
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Banks.xlsx');
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
