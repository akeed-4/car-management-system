import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormArray, FormBuilder } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InvoiceDropdownGridComponent } from '../../shared/invoice-dropdown-grid/invoice-dropdown-grid.component';
import { SupplierService } from '../../../services/supplier.service';
import { PurchasesService } from '../../../services/purchases.service';
import { PaymentService } from '../../../services/payment.service';
import { InventoryService } from '../../../services/inventory.service';
import { PurchaseInvoice } from '../../../models/purchase-invoice.model';
import { Payment, PaymentDetail, BeneficiaryType } from '../../../models/payment.model';
import { PaymentMethod, VoucherStatus } from '../../../models/payment-voucher.model';
import { AccountingService } from '../../accounting/accounting.service';
import { MatTableModule } from '@angular/material/table';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { NotificationService } from '@/src/services/notification.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    DxDataGridModule,
    DxButtonModule,
    InvoiceDropdownGridComponent,
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private supplierService = inject(SupplierService);
  private purchasesService = inject(PurchasesService);
  private paymentService = inject(PaymentService);
  private accountingService = inject(AccountingService);
  private inventoryService = inject(InventoryService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  

  paymentForm!: FormGroup;

  suppliers = signal<any[]>([]);
  accounts = toSignal(this.accountingService.accounts$, { initialValue: [] });
  expenseAccounts = signal<any[]>([]);
  
  outstandingInvoices = signal<PurchaseInvoice[]>([]);
  selectedInvoiceId = signal<number | null>(null);
  
  isEditMode = signal(false);
  editingPayment = signal<Payment | null>(null);
  
  selectedInvoiceDetails = computed(() => {
    const invId = this.selectedInvoiceId();
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId);
  });

  totalAmount = computed(() => {
    const details = this.details.value;
    return details.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0);
  });

  difference = computed(() => {
    const totalVoucherAmount = this.paymentForm.get('totalVoucherAmount')?.value || 0;
    return totalVoucherAmount - this.totalAmount();
  });

  onInvoiceSelected(invoice: any) {
    this.paymentForm.patchValue({ 
      purchaseInvoiceId: invoice.id
    });
  }

  ngOnInit() {
    this.initForm();
    
    // Load suppliers first
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.suppliers.set(suppliers);
      
      // Load outstanding invoices for the first supplier if available
      if (suppliers.length > 0) {
        this.purchasesService.getInvoices().subscribe(invoices => {
          this.outstandingInvoices.set(invoices);
        });
      }
    });
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.loadPayment(+id);
      } else {
        this.isEditMode.set(false);
      }
    });
  }

  private loadPayment(id: number) {
    this.paymentService.getPaymentById(id).subscribe({
      next: (payment) => {
        this.editingPayment.set(payment);
        this.populateForm(payment);
      },
      error: (error) => {
        console.error('Error loading payment:', error);
        this.notificationService.showError(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.ERROR_LOADING') || 'Error loading payment');
        this.router.navigate(['/accounts/payments']);
      }
    });
  }

  private populateForm(payment: Payment) {
    console.log('Populating form with payment:', payment);
    this.paymentForm.patchValue({
      voucherNumber: payment.voucherNumber,
      voucherDate: payment.voucherDate.toISOString().split('T')[0],
      totalVoucherAmount: payment.amount,
      notes: payment.notes,
      status: payment.status === VoucherStatus.Draft ? 'DRAFT' : payment.status === VoucherStatus.Approved ? 'APPROVED' : 'CANCELLED',
      createdBy: payment.createdBy
    });
    // Clear existing details
    while (this.details.length > 0) {
      this.details.removeAt(0);
    }
    // Add details
    payment.details.forEach(detail => {
      const detailGroup = this.fb.group({
        chassisNumber: [detail.chassisNumber || '', Validators.required],
        model: [detail.model || '', Validators.required],
        carId: [detail.carId],
        expenseAccountId: [detail.expenseAccountId || null],
        amount: [detail.amount, [Validators.required, Validators.min(0.01)]],
        note: [detail.note || '']
      });
      this.details.push(detailGroup);
    });
    if (payment.purchaseInvoiceId) {
      this.selectedInvoiceId.set(payment.purchaseInvoiceId);
      this.onSupplierChange(payment.beneficiaryId!, true);
    }
  }

  private initForm() {
    this.paymentForm = this.fb.group({
      voucherNumber: [`PV-${Date.now()}`],
      voucherDate: [new Date().toISOString().split('T')[0], Validators.required],
      paymentMethod: ['BANK_TRANSFER', Validators.required],
      accountId: [null, Validators.required],
      purchaseInvoiceId: [null],
      totalVoucherAmount: [0, [Validators.required, Validators.min(0.01)]],
      notes: [''],
      status: ['DRAFT'],
      createdBy: [1],
      details: this.fb.array([])
    });
    // Add at least one detail
    this.addDetail();
    // Load expense accounts for payment details
    this.accountingService.getAccountsByCategory('expense').subscribe(accounts => {
      this.expenseAccounts.set(accounts);
    });

  }

  get details(): FormArray {
    return this.paymentForm.get('details') as FormArray;
  }

  addDetail(car?: any) {
    const detail = this.fb.group({
      chassisNumber: [car?.chassisNumber || '', Validators.required],
      model: [car?.model || '', Validators.required],
      carId: [car?.id || null],
      expenseAccountId: [null], // Optional expense account
      amount: [0, [Validators.required, Validators.min(0.01)]],
      note: ['']
    });
    this.details.push(detail);
  }

  removeDetail(index: number) {
    if (this.details.length > 1) {
      this.details.removeAt(index);
    }
  }

  autoDistributeAmount() {
    const totalAmount = this.paymentForm.get('totalVoucherAmount')?.value || 0;
    const numDetails = this.details.length;
    if (numDetails > 0 && totalAmount > 0) {
      const amountPerDetail = totalAmount / numDetails;
      this.details.controls.forEach(detail => {
        detail.patchValue({ amount: amountPerDetail });
      });
    }
  }

  onSupplierChange(supplierId: number | null, preserveAmount: boolean = false) {
    const currentAmount = preserveAmount ? this.paymentForm.get('amount')?.value : 0;
    this.paymentForm.patchValue({ purchaseInvoiceId: null });
    if (supplierId) {
      this.purchasesService.getOutstandingInvoicesBySupplierId(supplierId).subscribe(invoices => {
        this.outstandingInvoices.set(invoices);
      });
    } else {
      this.outstandingInvoices.set([]);
    }
  }

  onInvoiceChange(invoiceId: number | null) {
    this.selectedInvoiceId.set(invoiceId);
    this.paymentForm.patchValue({ purchaseInvoiceId: invoiceId });
    if (invoiceId) {
      this.loadCarsByInvoice(invoiceId);
    } else {
      // Clear details if no invoice selected
      while (this.details.length > 0) {
        this.details.removeAt(0);
      }
    }
  }

  private loadCarsByInvoice(invoiceId: number) {
    this.inventoryService.getCarsByPurchaseInvoice(invoiceId).subscribe({
      next: (cars) => {
        // Clear existing details
        while (this.details.length > 0) {
          this.details.removeAt(0);
        }
        // Add cars as details
        cars.forEach(car => {
          this.addDetail({
            id: car.id,
            chassisNumber: car.chassisNumber || car.vin,
            model: `${car.make} ${car.model} ${car.year}`
          });
        });
        // If no cars, add one empty detail
        if (cars.length === 0) {
          this.addDetail();
        }
      },
      error: (error) => {
        console.error('Error loading cars for invoice:', error);
        // Add one empty detail if error
        this.addDetail();
      }
    });
  }

  savePayment() {
    if (this.paymentForm.invalid) {
      return;
    }

    const formValue = this.paymentForm.value;

    // Calculate total amount from details
    const totalAmount = formValue.details.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0);
    if (totalAmount <= 0) {
      alert('Total amount must be greater than 0');
      return;
    }

    // Check if total matches
    if (Math.abs(formValue.totalVoucherAmount - totalAmount) > 0.01) {
      alert('Total voucher amount must equal the sum of all detail amounts');
      return;
    }

    // Create details
    const details: PaymentDetail[] = formValue.details.map((d: any) => ({
      carId: d.carId,
      chassisNumber: d.chassisNumber,
      model: d.model,
      amount: d.amount,
      note: d.note || undefined,
      expenseAccountId: d.expenseAccountId || undefined
    }));

    // Create and save the payment using Payment model
    const statusEnum = formValue.status === 'DRAFT' ? VoucherStatus.Draft : formValue.status === 'APPROVED' ? VoucherStatus.Approved : VoucherStatus.Cancelled;
    
    const payment: Partial<Payment> = {
      voucherNumber: formValue.voucherNumber,
      voucherDate: new Date(formValue.voucherDate),
      amount: totalAmount,
      status: statusEnum,
      notes: formValue.notes || `Payment for ${formValue.details.length} cars`,
      createdBy: formValue.createdBy || 1,
      createdAt: new Date(),
      beneficiaryType: BeneficiaryType.Supplier, // Assuming supplier payments
      beneficiaryId: 1, // TODO: Get from form if needed
      purchaseInvoiceId: formValue.purchaseInvoiceId,
      accountId: formValue.accountId, // Add the account ID
      details: details
    };
    
    if (this.isEditMode()) {
      this.paymentService.updatePayment(payment, this.editingPayment()!.id!).subscribe({
        next: (updatedPayment) => {
          alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.UPDATED'));
          this.router.navigate(['/accounts/payments']);
        },
        error: (error) => {
          console.error('Error updating payment:', error);
          alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.ERROR_UPDATING') || 'Error updating payment');
        }
      });
    } else {
      this.paymentService.addPayment(payment).subscribe({
        next: (savedPayment) => {
          this.notificationService.showSuccess(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.SAVED') || 'Payment saved successfully'); 
          this.router.navigate(['/accounts/payments']);
        },
        error: (error) => {
          console.error('Error saving payment:', error);
          this.notificationService.showError(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.ERROR_SAVING') || 'Error saving payment');
        }
      });
    }
  }

  trackBySupplierId(index: number, supplier: any): number {
    return supplier.id;
  }

  trackByInvoiceId(index: number, invoice: PurchaseInvoice): number {
    return invoice.id;
  }

  trackByAccountId(index: number, account: any): number {
    return account.id;
  }
}