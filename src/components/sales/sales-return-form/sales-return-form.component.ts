import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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

@Component({
  selector: 'app-sales-return-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, CurrencyPipe, TranslateModule, DxDataGridModule, DxButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatCheckboxModule, MatDatepickerModule],
  templateUrl: './sales-return-form.component.html',
  styleUrl: './sales-return-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()]
})
export class SalesReturnFormComponent implements OnInit {
  private salesService = inject(SalesService);
  private salesReturnService = inject(SalesReturnService);
  private inventoryService = inject(InventoryService);
  private accountingService = inject(AccountingService);
  private invoiceIntegrationService = inject(InvoiceIntegrationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  returnForm!: FormGroup;

  // Form State
  returnNumber = signal<string>('');
  isSubmitting = signal(false);
  refundCalculation = signal<any>(null);

  // Mock data for development - replace with actual API call when backend is ready
  originalInvoices = signal<SalesInvoice[]>([
    {
      id: 1,
      invoiceNumber: 'SINV-001',
      invoiceDate: '2025-12-01',
      customerId: 1,
      customerName: 'John Doe',
      status: 'Pending',
      items: [
        {
          carId: 1,
          carDescription: 'Toyota Corolla 2022',
          quantity: 1,
          unitPrice: 50000,
          lineTotal: 50000
        },
      ],
      subtotal: 50000,
      vatAmount: 7500,
      totalAmount: 57500,
      amountPaid: 0,
      amountDue: 57500,
      ownershipTransferStatus: 'Not Started',
      isArchived: false
    },
    {
      id: 2,
      invoiceNumber: 'SINV-002',
      invoiceDate: '2025-12-05',
      customerId: 2,
      customerName: 'Jane Smith',
      status: 'Pending',
      items: [
        {
          carId: 2,
          carDescription: 'Honda Civic 2021',
          quantity: 1,
          unitPrice: 45000,
          lineTotal: 45000
        }
      ],
      subtotal: 45000,
      vatAmount: 6750,
      totalAmount: 51750,
      amountPaid: 0,
      amountDue: 51750,
      ownershipTransferStatus: 'Not Started',
      isArchived: false
    }
  ]);
  selectedOriginalInvoice = signal<SalesInvoice | null>(null);
  
  returnItems = signal<ReturnInvoiceItem[]>([]);
  
  totalAmount = computed(() => this.returnItems().reduce((sum, item) => sum + item.lineTotal, 0));

  ngOnInit() {
    this.generateReturnNumber();
    this.initializeForm();
    this.loadInvoices();
  }

  private generateReturnNumber(): void {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.returnNumber.set(`RT-S-${timestamp}-${random}`);
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

    // Listen to original invoice changes
    this.returnForm.get('originalInvoice')?.valueChanges.subscribe(value => {
      this.onInvoiceSelect(+value);
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

    // Listen to return items changes for refund calculation
    this.updateRefundCalculation();
  }

  private loadInvoices(): void {
    // Using mock data for now - replace with actual service call
    // In production: this.salesService.getEligibleInvoices().subscribe(...)
  }

  getQuantityOptions = (rowData: any) => {
    const maxQty = rowData?.originalQuantity || 0;
    return Array.from({ length: maxQty + 1 }, (_, i) => ({ value: i, text: i.toString() }));
  };

  customizeTotalText = (data: any) => {
    return `${this.translate.instant('SALES.RETURN.TOTAL')}: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  onInvoiceSelect(invoiceId: number): void {
    const invoice = this.originalInvoices().find(inv => inv.id === invoiceId);
    this.selectedOriginalInvoice.set(invoice ?? null);

    if (!invoice) {
      this.returnItems.set([]);
      this.refundCalculation.set(null);
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
    this.updateRefundCalculation();
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
      carId: itemsToReturn[0].carId,
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
      createdBy: 1 // Will be set from current user context
    };

    this.salesReturnService.createSalesReturn(salesReturn).subscribe({
      next: (response) => {
        this.translate.get('SALES.RETURN.SAVED_SUCCESS').subscribe(message => {
          console.log(message);
        });
        this.isSubmitting.set(false);
        this.router.navigate(['/sales/return']);
      },
      error: (error) => {
        console.error('Error saving return:', error);
        this.isSubmitting.set(false);
      }
    });
  }
}