import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { ProcurementService } from '../../../services/procurement.service';
import { PurchaseReturnService } from '../../../services/purchase-return.service';
import { InventoryService } from '../../../services/inventory.service';
import { ReturnInvoiceItem } from '../../../types/return-invoice-item.model';
import { PurchaseReturnInvoice } from '../../../types/purchase-return-invoice.model';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, TranslateModule, DxDataGridModule, DxButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule],
  templateUrl: './purchase-return-form.component.html',
  styleUrl: './purchase-return-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseReturnFormComponent implements OnInit {
  private procurementService = inject(ProcurementService);
  private purchaseReturnService = inject(PurchaseReturnService);
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  returnForm!: FormGroup;

  // Form State
  returnInvoiceNumber = signal(`RT-P-${Date.now()}`);
  returnInvoiceDate = signal(new Date().toISOString().split('T')[0]);

  originalInvoices = toSignal(this.procurementService.getInvoices(), { initialValue: [] });
  selectedOriginalInvoice = signal<PurchaseInvoice | null>(null);
  
  returnItems = signal<ReturnInvoiceItem[]>([]);
  
  totalAmount = computed(() => this.returnItems().reduce((sum, item) => sum + item.lineTotal, 0));

  ngOnInit() {
    this.returnForm = this.fb.group({
      returnDate: [this.returnInvoiceDate(), Validators.required],
      originalInvoice: [null, Validators.required]
    });

    // Listen to return date changes
    this.returnForm.get('returnDate')?.valueChanges.subscribe(value => {
      this.returnInvoiceDate.set(value);
    });

    // Listen to original invoice changes
    this.returnForm.get('originalInvoice')?.valueChanges.subscribe(value => {
      this.onInvoiceSelect(+value);
    });
  }

  getQuantityOptions = (rowData: any) => {
    const maxQty = rowData?.originalQuantity || 0;
    return Array.from({ length: maxQty + 1 }, (_, i) => ({ value: i, text: i.toString() }));
  };

  customizeTotalText = (data: any) => {
    return `الإجمالي الكلي: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

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
      alert(this.translate.instant('PROCUREMENT.PURCHASE_RETURN.ERROR_NO_ITEMS'));
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
    
    alert(this.translate.instant('PROCUREMENT.PURCHASE_RETURN.SAVED_SUCCESS'));
    this.router.navigate(['/procurement/return']);
  }
}