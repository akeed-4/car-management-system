import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PurchaseReturnService } from '../../../../services/purchase-return.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';

@Component({
  selector: 'app-cash-return-invoice-list',
  standalone: true,
  imports: [RouterLink, TranslateModule, SharedDataGridComponent, HasPermissionDirective],
  templateUrl: './cash-return-invoice-list.component.html',
  styleUrl: './cash-return-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashReturnInvoiceListComponent {
  private purchaseReturnService = inject(PurchaseReturnService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private responsiveService = inject(ResponsiveService);
  private permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;
  returnInvoices = toSignal(this.purchaseReturnService.getReturnInvoices(), { initialValue: [] });

  filteredReturnInvoices = computed(() => this.returnInvoices().filter(invoice => invoice.returnType === 'CASH'));

  customizeTotalText = (data: any) => {
    return `${this.translate.instant('PURCHASE_RETURN.TOTAL')}: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  onPrintClick = (e: any) => {
    this.router.navigate(['/purchases/return/print', e.row.data.id]);
  };

  onEditClick = (e: any) => {
    this.router.navigate(['/purchases/return/edit', e.row.data.id]);
  };

  onDeleteClick = (e: any) => {
    if (confirm(this.translate.instant('PURCHASE_RETURN.DELETE_CONFIRM'))) {
      // Call delete service
      alert('Delete functionality not implemented yet');
    }
  };

  /** Config-driven columns -- same fields/formats/alignment as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'returnInvoiceNumber', dataType: 'string', caption: 'PURCHASE_RETURN.COL_RETURN_NUMBER', alignment: 'right' },
    { dataField: 'returnInvoiceDate', dataType: 'date', format: 'yyyy-MM-dd', caption: 'PURCHASE_RETURN.COL_DATE', alignment: 'right' },
    { dataField: 'supplierName', dataType: 'string', caption: 'PURCHASE_RETURN.COL_SUPPLIER', minWidth: 200, alignment: 'right' },
    { dataField: 'totalAmount', dataType: 'number', format: { type: 'currency', currency: 'SAR' }, caption: 'PURCHASE_RETURN.COL_TOTAL', alignment: 'right' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'PURCHASE_RETURN.ACTIONS', width: 150, allowSorting: false, allowFiltering: false },
  ];

  /** Same print/edit/delete buttons as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'print', icon: 'print', labelKey: 'PURCHASE_RETURN.PRINT', visible: () => this.permissionService.hasPermission('purchases.returns.cash.view') },
    { id: 'edit', icon: 'edit', labelKey: 'PURCHASE_RETURN.EDIT', visible: () => this.permissionService.hasPermission('purchases.returns.cash.view') },
    { id: 'delete', icon: 'delete', labelKey: 'PURCHASE_RETURN.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('purchases.returns.cash.view') },
  ];

  /** Same "Total: <sum>" summary row as before (ported via valueFormat/displayFormat --
   *  the Shared DataGrid's summaryItems doesn't expose DevExtreme's customizeText hook). */
  summaryItems = [
    {
      column: 'totalAmount',
      summaryType: 'sum',
      valueFormat: { type: 'currency', currency: 'SAR' },
      displayFormat: `${this.translate.instant('PURCHASE_RETURN.TOTAL')}: {0}`,
    },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'print') this.onPrintClick(wrapped);
    else if (e.actionId === 'edit') this.onEditClick(wrapped);
    else if (e.actionId === 'delete') this.onDeleteClick(wrapped);
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (inv: any) => inv.returnInvoiceNumber;
  mobileTrackBy = (_index: number, inv: any) => inv.id;

  private formatCurrency = (value: number) => (value ?? 0).toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' });

  mobileFields: MobileCardField<any>[] = [
    { label: 'PURCHASE_RETURN.COL_DATE', value: (inv) => inv.returnInvoiceDate ? new Date(inv.returnInvoiceDate).toLocaleDateString() : '' },
    { label: 'PURCHASE_RETURN.COL_SUPPLIER', value: (inv) => inv.supplierName },
    { label: 'PURCHASE_RETURN.COL_TOTAL', value: (inv) => this.formatCurrency(inv.totalAmount) },
  ];

  mobilePrint(inv: any): void {
    this.onPrintClick({ row: { data: { id: inv.id } } });
  }

  mobileEdit(inv: any): void {
    this.onEditClick({ row: { data: { id: inv.id } } });
  }

  mobileDelete(inv: any): void {
    this.onDeleteClick({ row: { data: { id: inv.id } } });
  }
}
