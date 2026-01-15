import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, Input, OnChanges, SimpleChanges, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl, AbstractControl } from '@angular/forms';
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
import { provideNativeDateAdapter } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { PurchasesService } from '../../../services/purchases.service';
import { PurchaseReturnService } from '../../../services/purchase-return.service';
import { InventoryService } from '../../../services/inventory.service';
import { AccountingService } from '../../accounting/accounting.service';
import { ReturnInvoiceItem } from '../../../types/return-invoice-item.model';
import { PurchaseReturnInvoice, PurchaseReturnType } from '../../../types/purchase-return-invoice.model';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CreateJournalEntryDto } from '../../../components/accounting/models';

@Component({
  selector: 'app-purchase-return-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, CurrencyPipe, TranslateModule, DxDataGridModule, DxButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatIconModule, MatDatepickerModule, NgxMatSelectSearchModule],
  templateUrl: './purchase-return-form.component.html',
  styleUrl: './purchase-return-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
   providers: [provideNativeDateAdapter()],
})
export class PurchaseReturnFormComponent implements OnInit, OnChanges {
  @Input() returnType: PurchaseReturnType = 'CASH';
  @Input() customTitle: string = '';
  private procurementService = inject(PurchasesService);
  private purchaseReturnService = inject(PurchaseReturnService);
  private inventoryService = inject(InventoryService);
  private accountingService = inject(AccountingService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  returnForm!: FormGroup;

  // Form State
  returnInvoiceNumber = signal(`RT-P-${Date.now()}`);
  returnInvoiceDate = signal(new Date().toISOString().split('T')[0]);

  // Accounts for different return types
  cashBankAccounts = signal<any[]>([]);
  supplierAccounts = signal<any[]>([]);

  // Filter controls for mat-select search
  cashBankAccountFilterCtrl = new FormControl('');
  supplierAccountFilterCtrl = new FormControl('');

  // Convert filter controls to signals
  private cashBankAccountFilterSignal = toSignal(this.cashBankAccountFilterCtrl.valueChanges, { initialValue: '' });
  private supplierAccountFilterSignal = toSignal(this.supplierAccountFilterCtrl.valueChanges, { initialValue: '' });

  // Filtered accounts
  filteredCashBankAccounts = computed(() => {
    const filter = this.cashBankAccountFilterSignal()?.toLowerCase() || '';
    return this.cashBankAccounts().filter(a =>
      (a.accountNameAr?.toLowerCase().includes(filter) ?? false) || (a.accountCode?.toLowerCase().includes(filter) ?? false)
    );
  });

  filteredSupplierAccounts = computed(() => {
    const filter = this.supplierAccountFilterSignal()?.toLowerCase() || '';
    return this.supplierAccounts().filter(a =>
      (a.accountNameAr?.toLowerCase().includes(filter) ?? false) || (a.accountCode?.toLowerCase().includes(filter) ?? false)
    );
  });

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
      ? this.translate.instant('PURCHASES.PURCHASE_RETURN.CASH_RETURN_TITLE')
      : this.translate.instant('PURCHASES.PURCHASE_RETURN.CREDIT_RETURN_TITLE');
  }

  backRoute(): string {
    return '/purchases/purchase-returns';
  }

  ngOnInit() {
    this.loadAccounts();
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['returnType']) {
      // Re-initialize form when return type changes
      this.initForm();
    }
  }

  private loadAccounts(): void {
    // Load cash/bank accounts for cash returns
    this.accountingService.getAccountsByCategory('cash-bank').subscribe(accounts => {
      this.cashBankAccounts.set(accounts);
    });

    // Load supplier accounts for credit returns
    this.accountingService.getAccountsByCategory('supplier').subscribe(accounts => {
      this.supplierAccounts.set(accounts);
    });
  }

  private initForm(): void {
    const today = new Date();

    if (this.returnType === 'CASH') {
      this.returnForm = this.fb.group({
        returnInvoiceNumber: [{ value: this.returnInvoiceNumber(), disabled: true }],
        returnDate: [today, Validators.required],
        originalInvoice: [null, Validators.required],
        debitAccountId: [null, Validators.required] // Cash/Bank account for cash returns
      });
    } else {
      // CREDIT return
      this.returnForm = this.fb.group({
        returnInvoiceNumber: [{ value: this.returnInvoiceNumber(), disabled: true }],
        returnDate: [today, Validators.required],
        originalInvoice: [null, Validators.required],
        creditAccountId: [null, Validators.required] // Supplier account for credit returns
      });
    }

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
    return `الإجمالي الكلي: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
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
      alert(this.translate.instant('PURCHASES.PURCHASE_RETURN.ERROR_NO_ITEMS'));
      return;
    }

    if (!this.returnForm.valid) {
      alert(this.translate.instant('PURCHASES.PURCHASE_RETURN.ERROR_INVALID_FORM'));
      return;
    }

    const formValue = this.returnForm.value;
    const totalAmount = this.totalAmount();

    let debitAccountId: number | undefined;
    let creditAccountId: number | undefined;

    if (this.returnType === 'CASH') {
      debitAccountId = formValue.debitAccountId; // Cash/Bank account
      // For cash returns, credit goes to inventory (reversing the original purchase)
      creditAccountId = originalInvoice.debitAccountId; // Inventory account
    } else {
      // CREDIT return
      creditAccountId = formValue.creditAccountId; // Supplier account
      // For credit returns, debit goes to inventory (reversing the original purchase)
      debitAccountId = originalInvoice.debitAccountId; // Inventory account
    }

    const newReturn: Omit<PurchaseReturnInvoice, 'id'> = {
      returnInvoiceNumber: this.returnInvoiceNumber(),
      returnInvoiceDate: this.returnInvoiceDate(),
      originalInvoiceId: originalInvoice.id,
      supplierId: originalInvoice.supplierId,
      supplierName: originalInvoice.supplier?.name || '',
      returnType: this.returnType,
      debitAccountId: debitAccountId,
      creditAccountId: creditAccountId,
      items: itemsToReturn,
      totalAmount: totalAmount,
    };

    // Save the return invoice
    this.purchaseReturnService.addReturnInvoice(newReturn).subscribe({
      next: (createdReturn) => {
        alert(this.translate.instant('PURCHASES.PURCHASE_RETURN.SUCCESS_RETURN_SAVED'));

    // Update inventory - reduce inventory for returned items
    itemsToReturn.forEach(item => {
      this.inventoryService.decrementCarQuantity(item.carId, item.returnQuantity);
    });

    // Create accounting journal entry based on return type

  

},      error: (error) => {
        console.error('Error saving return invoice:', error);
        alert(this.translate.instant('PURCHASES.PURCHASE_RETURN.ERROR_SAVING_RETURN'));
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
