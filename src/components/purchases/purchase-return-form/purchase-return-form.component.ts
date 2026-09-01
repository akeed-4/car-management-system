import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, Input, OnChanges, SimpleChanges, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PurchasesService } from '../../../services/purchases.service';
import { PurchaseReturnService } from '../../../services/purchase-return.service';
import { ReturnInvoiceItem } from '../../../models/return-invoice-item.model';
import { PurchaseReturnInvoice, PurchaseReturnType } from '../../../models/purchase-return-invoice.model';
import { PurchaseInvoice } from '../../../models/purchase-invoice.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@/src/services/notification.service';
import { extractErrorMessage } from '@/src/models/http-error-message';
@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, CurrencyPipe, TranslateModule, DxDataGridModule, DxButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatTooltipModule, ],
  templateUrl: './purchase-return-form.component.html',
  styleUrl: './purchase-return-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
   providers: [provideNativeDateAdapter()],
})
export class PurchaseReturnFormComponent implements OnInit, OnChanges {
  @Input() returnType: PurchaseReturnType = 'CASH';
  @Input() customTitle: string = '';
  private procurementService = inject(PurchasesService);
  private purchaseReturnService = inject(PurchaseReturnService);  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  returnForm!: FormGroup;

  // Form State
  returnInvoiceDate = signal(new Date().toISOString().split('T')[0]);

  // Mock data for development - replace with actual API call when backend is ready
    invoices = toSignal(this.procurementService.getInvoices(), { initialValue: [] });
  originalInvoices = computed(() =>
    this.invoices().filter(inv =>
      inv.items.some(item => item.quantity > 0) && // Invoices with items in stock
      inv.paymentType === (this.returnType === 'CASH' ? 'cash' : 'credit') // Filter by payment type
    )
  );
  selectedOriginalInvoice = signal<PurchaseInvoice | null>(null);

  returnItems = signal<ReturnInvoiceItem[]>([]);

  totalAmount = computed(() => this.returnItems().reduce((sum, item) => sum + item.lineTotal, 0));

  getTitle(): string {
    return this.returnType === 'CASH'
      ? this.translate.instant('PURCHASE_RETURN.CASH_RETURN_TITLE')
      : this.translate.instant('PURCHASE_RETURN.CREDIT_RETURN_TITLE');
  }

  backRoute(): string {
    return '/purchases/purchase-returns';
  }

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['returnType']) {
      // Re-initialize form when return type changes
      this.initForm();
    }
  }

  private initForm(): void {
    const today = new Date();

    this.returnForm = this.fb.group({
      returnDate: [today, Validators.required],
      originalInvoice: [null, Validators.required],
    });

    // Listen to return date changes
    this.returnForm.get('returnDate')?.valueChanges.subscribe(value => {
      if (value instanceof Date) {
        this.returnInvoiceDate.set(value.toISOString().split('T')[0]);
      } else if (value === null) {
        this.returnInvoiceDate.set(new Date().toISOString().split('T')[0]);
      }
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
    return `Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙƒÙ„ÙŠ: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 Ø±.Ø³'}`;
  };

  onRowUpdated(event: any): void {
    // Update the lineTotal when returnQuantity changes
    const updatedData = event.data;
    if (updatedData.returnQuantity !== undefined) {
      updatedData.lineTotal = updatedData.unitPrice * updatedData.returnQuantity;
    }
    // Find and update the item in the signal
    this.returnItems.update(items => 
      items.map(item => 
        item.carId === updatedData.carId ? { ...updatedData } : item
      )
    );
  }

  onInvoiceSelect(invoiceId: number): void {
    const invoice = this.originalInvoices().find(inv => inv.id === invoiceId)??null;
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
      salesPrice: item.salesPrice,
      quantity: item.quantity,
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
      this.notificationService.showWarning(this.translate.instant('PURCHASES.PURCHASE_RETURN.ERROR_NO_ITEMS'));
      return;
    }

    if (!this.returnForm.valid) {
      this.notificationService.showWarning(this.translate.instant('PURCHASES.PURCHASE_RETURN.ERROR_INVALID_FORM'));
      return;
    }
    const totalAmount = this.totalAmount();

    // Both GL accounts are derived server-side at approval time (Store accounting configuration,
    // the supplier's linked account, and -- for cash returns -- the configured cash account) --
    // there is no client override path for either leg. The backend still posts the stock
    // decrease at approval; the client must NOT pre-apply inventory changes itself (that used to
    // double-decrement stock).
    const newReturn: Omit<PurchaseReturnInvoice, 'id'> = {
      returnInvoiceNumber: '',
      returnInvoiceDate: this.returnInvoiceDate(),
      originalInvoiceId: originalInvoice.id,
      supplierId: originalInvoice.supplierId,
      supplierName: originalInvoice.supplier?.name || '',
      returnType: this.returnType,
      items: itemsToReturn,
      totalAmount: totalAmount,
    };

    // Save the return as a DRAFT -- posting happens server-side when it is approved.
    this.purchaseReturnService.addReturnInvoice(newReturn).subscribe({
      next: (_createdReturn) => {
        this.notificationService.showSuccess(this.translate.instant('PURCHASES.PURCHASE_RETURN.SUCCESS_RETURN_SAVED'));
        this.router.navigate([this.backRoute()]);
      },
      error: (error) => {
        console.error('Error saving return invoice:', error);
        this.notificationService.showError(extractErrorMessage(error, this.translate, 'PURCHASES.PURCHASE_RETURN.ERROR_SAVING_RETURN'));
      }
    });
  }
 validateReturnQuantity = (options: any) => {
    const value = options.value;
    const data = options.data;
    if (value < 0) {
      return { isValid: false, message: this.translate.instant('SALES.RETURN.QUANTITY_CANNOT_BE_NEGATIVE') };
    }
    if (value > data.originalQuantity) {
      return { isValid: false, message: this.translate.instant('SALES.RETURN.QUANTITY_CANNOT_EXCEED_ORIGINAL', { original: data.originalQuantity }) };
    }
    return { isValid: true };
  };
}
