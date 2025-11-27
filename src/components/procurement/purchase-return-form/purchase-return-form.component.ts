import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProcurementService } from '../../../services/procurement.service';
import { PurchaseReturnService } from '../../../services/purchase-return.service';
import { InventoryService } from '../../../services/inventory.service';
import { ReturnInvoiceItem } from '../../../types/return-invoice-item.model';
import { PurchaseReturnInvoice } from '../../../types/purchase-return-invoice.model';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';

@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe],
  templateUrl: './purchase-return-form.component.html',
  styleUrl: './purchase-return-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseReturnFormComponent {
  private procurementService = inject(ProcurementService);
  private purchaseReturnService = inject(PurchaseReturnService);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  // Form State
  returnInvoiceNumber = signal(`RT-P-${Date.now()}`);
  returnInvoiceDate = signal(new Date().toISOString().split('T')[0]);

  originalInvoices = this.procurementService.invoices$;
  selectedOriginalInvoice = signal<PurchaseInvoice | null>(null);
  
  returnItems = signal<ReturnInvoiceItem[]>([]);
  
  totalAmount = computed(() => this.returnItems().reduce((sum, item) => sum + item.lineTotal, 0));

  onInvoiceSelect(invoiceId: number): void {
    const invoice = this.originalInvoices().find(inv => inv.id === invoiceId);
    this.selectedOriginalInvoice.set(invoice ?? null);
    
    if (!invoice) {
      this.returnItems.set([]);
      return;
    }
    
    const items: ReturnInvoiceItem[] = invoice.items.map(item => ({
      carId: item.carId,
      carDescription: item.carDescription,
      unitPrice: item.unitPrice,
      originalQuantity: item.quantity,
      returnQuantity: 0,
      lineTotal: 0,
    }));
    this.returnItems.set(items);
  }

  updateReturnQuantity(carId: number, quantity: number): void {
    this.returnItems.update(items =>
      items.map(item => {
        if (item.carId === carId) {
          const validQuantity = Math.max(0, Math.min(quantity, item.originalQuantity));
          return {
            ...item,
            returnQuantity: validQuantity,
            lineTotal: item.unitPrice * validQuantity,
          };
        }
        return item;
      })
    );
  }

  saveReturn(): void {
    const originalInvoice = this.selectedOriginalInvoice();
    const itemsToReturn = this.returnItems().filter(item => item.returnQuantity > 0);

    if (!originalInvoice || itemsToReturn.length === 0) {
      alert('الرجاء تحديد الكميات المرتجعة.');
      return;
    }

    const newReturn: Omit<PurchaseReturnInvoice, 'id'> = {
      returnInvoiceNumber: this.returnInvoiceNumber(),
      returnInvoiceDate: this.returnInvoiceDate(),
      originalInvoiceId: originalInvoice.id,
      supplierId: originalInvoice.supplierId,
      supplierName: originalInvoice.supplierName,
      items: itemsToReturn,
      totalAmount: this.totalAmount(),
    };
    
    this.purchaseReturnService.addReturnInvoice(newReturn);

    // Update inventory
    itemsToReturn.forEach(item => {
      this.inventoryService.decrementCarQuantity(item.carId, item.returnQuantity);
    });
    
    alert('تم إنشاء فاتورة المرتجع بنجاح وتحديث المخزون.');
    this.router.navigate(['/procurement/return']);
  }
}