import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
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
import { BankService } from '../../../../services/bank.service';
import { NotificationService } from '../../../../services/notification.service';
import { Bank } from '../../../../models/bank.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';

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
    TranslateModule,
    SharedDataGridComponent,
    SharedMobileListComponent
  ],
  templateUrl: './bank-list.component.html',
  styleUrls: ['./bank-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankManagementListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private bankService = inject(BankService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  canCreate = computed(() => this.permissionService.hasPermission('bank.create'));

  banks = signal<Bank[]>([]);
  loading = signal(false);
  mobileSearch = signal('');

  /** Client-side search for the mobile card list (desktop keeps DevExtreme's own search panel). */
  filteredBanks = computed(() => {
    const term = this.mobileSearch().toLowerCase();
    const banks = this.banks();
    if (!term) return banks;
    return banks.filter(b =>
      b.bankNameEnglish?.toLowerCase().includes(term) ||
      b.bankNameArabic?.toLowerCase().includes(term) ||
      b.bankCode?.toLowerCase().includes(term) ||
      b.swiftCode?.toLowerCase().includes(term)
    );
  });

  /** Config-driven columns for the Shared DataGrid (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'bankCode', dataType: 'string', caption: 'BANK.BANK_CODE', width: 120 },
    { dataField: 'bankNameEnglish', dataType: 'string', caption: 'BANK.NAME_ENGLISH' },
    { dataField: 'bankNameArabic', dataType: 'string', caption: 'BANK.NAME_ARABIC' },
    { dataField: 'swiftCode', dataType: 'string', caption: 'BANK.SWIFT_CODE', width: 120 },
    { dataField: 'country', dataType: 'string', caption: 'BANK.COUNTRY', width: 130 },
    { dataField: 'currency', dataType: 'string', caption: 'BANK.CURRENCY', width: 100 },
    { dataField: 'isActive', dataType: 'boolean', caption: 'COMMON.ACTIVE', width: 110, type: 'status' },
  ];

  /** Row actions -- dispatched through the grid's single rowAction output. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'visibility', labelKey: 'COMMON.VIEW' },
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('bank.edit') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('bank.delete') },
  ];


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
    this.router.navigate(['/entities/banks/new']);
  }

  onView = (e: any): void => {
    this.router.navigate(['/entities/banks/view', e.row.data.id]);
  };

  onEdit = (e: any): void => {
    this.router.navigate(['/entities/banks/edit', e.row.data.id]);
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

  /** Single dispatcher for the Shared DataGrid's rowAction output -- routes to
   *  the exact same handlers the inline templates used before. */
  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'view') this.onView(wrapped);
    else if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }

  /** Same field set as the desktop grid's visible columns, for the mobile card list. */
  mobileFields: MobileListFieldDto<Bank>[] = [
    { label: 'BANK.NAME_ARABIC', value: (b) => b.bankNameArabic },
    { label: 'BANK.SWIFT_CODE', value: (b) => b.swiftCode },
    { label: 'BANK.COUNTRY', value: (b) => b.country },
    { label: 'BANK.CURRENCY', value: (b) => b.currency },
    {
      label: 'COMMON.ACTIVE',
      value: (b) => this.translate.instant(b.isActive ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE'),
      type: 'status',
      statusClass: (b) => (b.isActive ? 'success' : 'neutral'),
    },
  ];

  /** Same view/edit/delete actions as the desktop grid's row actions. */
  mobileActions: MobileListActionDto<Bank>[] = [
    { id: 'view', icon: 'visibility', labelKey: 'COMMON.VIEW' },
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('bank.edit') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('bank.delete') },
  ];

  mobileTitleOf = (b: Bank) => b.bankNameEnglish;
  mobileTrackBy = (index: number, b: Bank) => b.id ?? index;

  onMobileAction(e: MobileListActionEvent<Bank>): void {
    const wrapped = { row: { data: e.item } };
    if (e.actionId === 'view') this.onView(wrapped);
    else if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Banks');
        exportDataGrid({ component: this.grid.getInstance(), worksheet }).then(() => {
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
