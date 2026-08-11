import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PurchaseReturnService } from '../../../../services/purchase-return.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';

@Component({
  selector: 'app-cash-return-invoice-list',
  standalone: true,
  imports: [RouterLink, TranslateModule, DxDataGridModule, MobileCardListComponent],
  templateUrl: './cash-return-invoice-list.component.html',
  styleUrl: './cash-return-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashReturnInvoiceListComponent {
  private purchaseReturnService = inject(PurchaseReturnService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private responsiveService = inject(ResponsiveService);
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
