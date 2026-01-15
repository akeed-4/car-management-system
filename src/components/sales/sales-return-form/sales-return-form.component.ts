import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../../../services/sales.service';
import { SalesReturnService } from '../../../services/sales-return.service';
import { InventoryService } from '../../../services/inventory.service';
import { AccountingService } from '../../../components/accounting/accounting.service';
import { InvoiceIntegrationService } from '../../../services/invoice-integration.service';
import { ReturnInvoiceItem } from '../../../types/return-invoice-item.model';
import { SalesReturn } from '../../../types/sales-return.model';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SalesReturnInvoice } from '@/src/types/sales-return-invoice.model';

@Component({
  selector: 'app-sales-return-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, CurrencyPipe, TranslateModule, DxDataGridModule, DxButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatCheckboxModule, MatIconModule, MatDatepickerModule],
  templateUrl: './sales-return-form.component.html',
  styleUrl: './sales-return-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()]
})
export class SalesReturnFormComponent implements OnInit {

 @Input() isCashReturn: boolean = false;
  customTitle: string;
  private salesService = inject(SalesService);
  private salesReturnService = inject(SalesReturnService);
  private inventoryService = inject(InventoryService);
  private accountingService = inject(AccountingService);
  private invoiceIntegrationService = inject(InvoiceIntegrationService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  returnForm: FormGroup;

  // Form State
  returnNumber = signal<string>('');
  isSubmitting = signal(false);
  refundCalculation = signal<any>(null);
  Eitemode: boolean;
  invoiceId: any;

  constructor() {
    // Initialize form with default empty form to prevent NG01052 error
    this.returnForm = this.fb.group({
      returnDate: [new Date(), Validators.required],
      originalInvoice: [null, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      depositRefundable: [false],
      depositAmount: [0, [Validators.min(0)]],
      notes: ['']
    });
  }

  // Load invoices from API
  originalInvoices = signal<SalesInvoice[]>([]);
  selectedOriginalInvoice = signal<SalesInvoice | null>(null);
  selectedOriginalInvoicereturn = signal<SalesReturnInvoice | null>(null);
  returnItems = signal<ReturnInvoiceItem[]>([]);
  
  totalAmount = computed(() => this.returnItems().reduce((sum, item) => sum + item.lineTotal, 0));

  ngOnInit() {
    // Read type query parameter (cash or credit)
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['type'] === 'cash') {
        this.Eitemode=true;
        this.isCashReturn = true;
      } else if (params['type'] === 'credit') {
        this.isCashReturn = false;
      }
    });

    // Read id parameter for edit mode
    this.activatedRoute.params.subscribe(params => {
      this. invoiceId = params['id'];
      if (this.invoiceId) {
        // Edit mode - load existing invoice data
        this.loadInvoiceForEdit(+this.invoiceId);
      } else {
        // Create mode
        this.generateReturnNumber();
        this.initializeForm();
        this.loadInvoices();
      }
    });
  }

  private loadInvoiceForEdit(invoiceId: number): void {
    this.salesReturnService.getReturnInvoiceById(invoiceId).subscribe({
      next: (invoice) => {
        this.selectedOriginalInvoicereturn.set(invoice);
        this.isCashReturn = invoice.isCash || false;
        console.log('Loaded invoice for edit:', invoice);
        // Set form data with actual return invoice values
        this.returnForm = this.fb.group({
          returnDate: [new Date(invoice.returnDate) || new Date(), Validators.required],
          originalInvoice: [invoice.invoiceNo, Validators.required],
          reason: [invoice.reason || '', [Validators.required, Validators.minLength(10)]],
          depositRefundable: [false],
          depositAmount: [0, [Validators.min(0)]],
          notes: ['']
        });
console.log('Return Form initialized for edit:', invoice.items);
        // Load invoice items
        const items: ReturnInvoiceItem[] = invoice.items.map(item => ({
          carId: item.carId,
          carDescription: item.carDescription || 'Car',
          unitPrice: item.unitPrice || 0,
          salesPrice: item.salesPrice ,
          quantity: item.quantity,
          originalQuantity: item.originalQuantity,
          returnQuantity: item.returnQuantity || 0,
          lineTotal: (item.salesPrice || 0) * (item.returnQuantity || 0),
        }));
        
        this.returnItems.set(items);
        this.generateReturnNumber();
        this.setupFormListeners();
        this.updateRefundCalculation();
        this.loadInvoices();
      },
      error: (error) => {
        console.error('Failed to load invoice for edit:', error);
        this.generateReturnNumber();
        this.initializeForm();
        this.loadInvoices();
      }
    });
  }

  private setupFormListeners(): void {
    // Listen to original invoice changes
    this.returnForm.get('originalInvoice')?.valueChanges.subscribe(value => {
      this.onInvoiceSelect(value);
    });

    // Listen to depositRefundable changes
    this.returnForm.get('depositRefundable')?.valueChanges.subscribe(value => {
      const depositField = this.returnForm.get('depositAmount');
      if (value) {
        depositField?.enable();
      } else {
        depositField?.disable();
        depositField?.setValue(0);
      }
    });
  }


  private generateReturnNumber(): void {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.returnNumber.set(`RT-S-${timestamp}-${random}`);
  }
getTitle(): string {
    return this.isCashReturn ? this.translate.instant('SALES.RETURN.CASH_RETURN_TITLE') : this.translate.instant('SALES.RETURN.CREDIT_RETURN_TITLE');
  }
  private initializeForm(): void {
    this.returnForm = this.fb.group({
      returnDate: [new Date(), Validators.required],
      originalInvoice: [null, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      depositRefundable: [false],
      depositAmount: [0, [Validators.min(0)]],
      notes: ['']
    });

    this.setupFormListeners();
    // Listen to return items changes for refund calculation
    this.updateRefundCalculation();
  }

  private loadInvoices(): void {
    // Load all invoices and filter for those eligible for returns
    this.salesService.getInvoices().subscribe({
      next: (invoices) => {
        // Filter invoices that are eligible for returns
        // For now, include all non-archived invoices with status 'Paid' or 'Pending'
        // In the future, this could be enhanced to check for existing returns, etc.
        const paymentMethodFilter = this.isCashReturn ? 'Cash' : 'Credit';
        const eligibleInvoices = invoices.filter(invoice =>
          !invoice.isArchived &&
          (invoice.status === 'Paid' || invoice.status === 'Pending') &&
          invoice.isCash === this.isCashReturn ? true : false );
        this.originalInvoices.set(eligibleInvoices);
      },
      error: (error) => {
        console.error('Failed to load invoices for returns:', error);
        // Could show a toast notification here
      }
    });
  }

  getQuantityOptions = (rowData: any) => {
    const maxQty = rowData?.originalQuantity || 0;
    return Array.from({ length: maxQty + 1 }, (_, i) => ({ value: i, text: i.toString() }));
  };

  customizeTotalText = (data: any) => {
    return `${this.translate.instant('SALES.RETURN.TOTAL')}: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  calculateLineTotal = (rowData: any) => {
    return (rowData.returnQuantity || 0) * (rowData.salePrice || 0);
  };

  onInvoiceSelect(invoiceId: any): void {
    const id = +invoiceId;
    if (!id || isNaN(id)) {
      this.returnItems.set([]);
      this.refundCalculation.set(null);
      this.selectedOriginalInvoice.set(null);
      return;
    }

    this.salesService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.selectedOriginalInvoice.set(invoice);
        const items: ReturnInvoiceItem[] = invoice.items.map(item => ({
          carId: item.carId,
          carDescription: item.carDescription || 'Car',
          unitPrice: item.unitPrice || 0,
          salesPrice: item.salesPrice || 0,
          quantity: item.quantity,
          originalQuantity: item.quantity,
          returnQuantity: item.returnQuantity || 0,
          lineTotal: (item.salesPrice || 0) * (item.returnQuantity || 0),
        }));
      console.log(items)
        this.returnItems.set(items);
        this.updateRefundCalculation();
      },
      error: (error) => {
        console.error('Failed to load invoice details:', error);
        this.returnItems.set([]);
        this.refundCalculation.set(null);
        this.selectedOriginalInvoice.set(null);
      }
    });
  }

  updateReturnQuantity(carId: number, quantity: number): void {
    this.returnItems.update(items =>
      items.map(item => {
        if (item.carId === carId) {
          const validQuantity = Math.max(0, Math.min(quantity, item.originalQuantity));
          return {
            ...item,
            returnQuantity: validQuantity,
            lineTotal: item.salesPrice * validQuantity,
          };
        }
        return item;
      })
    );
    this.updateRefundCalculation();
  }

  private updateRefundCalculation(): void {
    const invoice = this.selectedOriginalInvoice();
    const items = this.returnItems();
    
    if (!invoice || items.length === 0) {
      this.refundCalculation.set(null);
      return;
    }

    const returnedAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const depositRefundable = this.returnForm.get('depositRefundable')?.value ?? false;
    const depositAmount = depositRefundable ? (this.returnForm.get('depositAmount')?.value ?? 0) : 0;
    
    // Calculate depreciation (simplified: 10% per month of use)
    const depreciation = returnedAmount * 0.10;
    const restockingFee = returnedAmount * 0.05;
    const taxableRefund = returnedAmount - depreciation - restockingFee;
    const vatOnRefund = taxableRefund * 0.15; // 15% VAT
    const netRefund = taxableRefund - vatOnRefund + depositAmount;

    this.refundCalculation.set({
      returnedAmount,
      depreciation,
      restockingFee,
      taxableRefund,
      vatOnRefund,
      depositAmount,
      netRefund
    });
  }

  saveReturn(): void {
    if (!this.returnForm.valid) {
      console.warn('Form is invalid');
      return;
    }

    const originalInvoice = this.selectedOriginalInvoice();
    const itemsToReturn = this.returnItems().filter(item => item.returnQuantity > 0);

    if (!originalInvoice || itemsToReturn.length === 0) {
      console.warn('No items to return');
      return;
    }

    this.isSubmitting.set(true);

    const salesReturn: SalesReturn = {
      returnNo: this.returnNumber(),
      invoiceId: originalInvoice.id,
      carId: itemsToReturn.length > 0 ? itemsToReturn[0].carId : undefined,
      vin: '', // Will be fetched from car details
      salePrice: this.totalAmount(),
      vatAmount: this.refundCalculation()?.vatOnRefund || 0,
      depositAmount: this.returnForm.get('depositAmount')?.value || 0,
      refundableAmount: this.refundCalculation()?.netRefund || 0,
      depositRefundable: this.returnForm.get('depositRefundable')?.value || false,
      reason: this.returnForm.get('reason')?.value,
      status: 'PENDING_APPROVAL',
      returnDate: new Date(this.returnForm.get('returnDate')?.value),
      approvedBy: undefined,
      approvedDate: undefined,
      rejectionReason: undefined,
      isCash: this.isCashReturn,
      createdBy: 1, // Will be set from current user context
      items: itemsToReturn
    };

    // Check if we're in edit mode
    const existingReturn = this.selectedOriginalInvoicereturn();
    if (this.Eitemode) {
      // Edit mode - update existing return
      this.salesReturnService.updateSalesReturn(this.invoiceId, salesReturn).subscribe({
        next: (response) => {
          this.translate.get('SALES.RETURN.UPDATED_SUCCESS').subscribe(message => {
            console.log(message);
          });
          this.isSubmitting.set(false);
          // Navigate back to list or show success message
          this.router.navigate(['/sales/return']);
        },
        error: (error) => {
          console.error('Error updating return:', error);
          this.isSubmitting.set(false);
        }
      });
    } else {
      // Create mode - create new return
      this.salesReturnService.createSalesReturn(salesReturn).subscribe({
        next: (response) => {
          this.translate.get('SALES.RETURN.SAVED_SUCCESS').subscribe(message => {
            console.log(message);
          });
          this.isSubmitting.set(false);
          // Navigate back to list or show success message
          this.router.navigate(['/sales/return']);
        },
        error: (error) => {
          console.error('Error saving return:', error);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  onRowUpdating(e: any): void {
    if (e.newData.returnQuantity !== undefined) {
      this.updateReturnQuantity(e.oldData.carId, e.newData.returnQuantity);
      e.cancel = true; // prevent the grid from updating the data source
    }
  }

  onCellValueChanged(e: any): void {
    if (e.column.dataField === 'returnQuantity') {
      this.updateReturnQuantity(e.data.carId, e.value);
      // Force signal update since DevExtreme modifies the array directly
      this.returnItems.set([...this.returnItems()]);
    }
  }
}