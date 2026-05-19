import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharikatSalesService } from '../../../services/sharikat-sales.service';
import { SharikatSalesOrder, CreateSharikatSalesOrderDto, FleetVehicleItem, ConvertQuotationToOrderDto } from '../../../models/sales-lifecycle/sharikat-sales-order.model';
import { InvoiceStatus, InvoiceStatusHelper } from '../../../models/enums/invoice-status.enum';

/**
 * Sharikat Sales Order Form Component
 * Create and edit corporate/fleet sales orders
 */
@Component({
  selector: 'app-sharikat-sales-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatStepperModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './sharikat-sales-form.component.html',
  styleUrls: ['./sharikat-sales-form.component.css']
})
export class SharikatSalesFormComponent implements OnInit {
  orderForm!: FormGroup;
  creditCheckForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  orderId?: number;
  order?: SharikatSalesOrder;

  // Dropdown data
  companies: any[] = [];
  quotations: any[] = [];
  carModels: any[] = [];
  branches: any[] = [];
  
  // Credit check result
  creditCheckResult: any = null;
  requiresApproval = false;

  // Vehicle allocation
  displayedColumns: string[] = ['modelName', 'quantity', 'allocatedVINs', 'actions'];

  InvoiceStatus = InvoiceStatus;
  InvoiceStatusHelper = InvoiceStatusHelper;

  constructor(
    private fb: FormBuilder,
    private sharikatService: SharikatSalesService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadReferenceData();

    // Check if editing existing order
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.orderId = +params['id'];
        this.isEditMode = true;
        this.loadOrder();
      }
    });

    // Check if converting from quotation
    this.route.queryParams.subscribe(params => {
      if (params['quotationId']) {
        this.loadQuotationForConversion(+params['quotationId']);
      }
    });
  }

  initializeForms(): void {
    this.orderForm = this.fb.group({
      customerId: [null, Validators.required],
      quotationId: [null],
      branchId: [null, Validators.required],
      purchaseOrderNumber: ['', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      taxAmount: [0],
      grandTotal: [{ value: 0, disabled: true }],
      creditLimit: [0],
      paymentTermDays: [30, Validators.required],
      deliveryDate: [null],
      notes: [''],
      vehicles: this.fb.array([])
    });

    this.creditCheckForm = this.fb.group({
      requestedAmount: [0, Validators.required]
    });

    // Auto-calculate grand total
    this.orderForm.get('totalAmount')?.valueChanges.subscribe(() => this.calculateGrandTotal());
    this.orderForm.get('taxAmount')?.valueChanges.subscribe(() => this.calculateGrandTotal());
  }

  get vehicles(): FormArray {
    return this.orderForm.get('vehicles') as FormArray;
  }

  loadReferenceData(): void {
    // Load companies, quotations, car models, branches
    this.companies = [
      { id: 1, nameAr: 'شركة المتحدة للتجارة', nameEn: 'United Trading Company', creditLimit: 500000 },
      { id: 2, nameAr: 'مؤسسة النقل الحديث', nameEn: 'Modern Transport Est.', creditLimit: 750000 }
    ];

    this.quotations = [
      { id: 1, quotationNumber: 'QT-2024-001', customerId: 1, totalAmount: 450000, status: 'Approved' },
      { id: 2, quotationNumber: 'QT-2024-002', customerId: 2, totalAmount: 680000, status: 'Approved' }
    ];

    this.carModels = [
      { id: 1, nameAr: 'هايلوكس 2024', nameEn: 'Hilux 2024', price: 120000 },
      { id: 2, nameAr: 'لاندكروزر 2024', nameEn: 'Land Cruiser 2024', price: 280000 }
    ];

    this.branches = [
      { id: 1, nameAr: 'فرع الرياض الرئيسي', nameEn: 'Riyadh Main Branch' },
      { id: 2, nameAr: 'فرع جدة', nameEn: 'Jeddah Branch' }
    ];
  }

  loadOrder(): void {
    if (!this.orderId) return;

    this.isLoading = true;
    this.sharikatService.getById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.orderForm.patchValue({
          customerId: order.customerId,
          quotationId: order.quotationId,
          branchId: order.branchId,
          purchaseOrderNumber: order.purchaseOrderNumber,
          totalAmount: order.totalAmount,
          taxAmount: order.taxAmount,
          creditLimit: order.creditLimit,
          paymentTermDays: order.paymentTermDays,
          deliveryDate: order.deliveryDate,
          notes: order.notes
        });

        // Load vehicles
        if (order.vehicles && order.vehicles.length > 0) {
          order.vehicles.forEach(vehicle => {
            this.addVehicle(vehicle);
          });
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Failed to load order');
        this.isLoading = false;
      }
    });
  }

  loadQuotationForConversion(quotationId: number): void {
    const quotation = this.quotations.find(q => q.id === quotationId);
    if (quotation) {
      this.orderForm.patchValue({
        customerId: quotation.customerId,
        quotationId: quotation.id,
        totalAmount: quotation.totalAmount
      });
      
      // Auto-calculate tax (15%)
      const tax = quotation.totalAmount * 0.15;
      this.orderForm.patchValue({ taxAmount: tax });
    }
  }

  addVehicle(vehicle?: FleetVehicleItem): void {
    const vehicleGroup = this.fb.group({
      carModelId: [vehicle?.carModelId || null, Validators.required],
      quantity: [vehicle?.quantity || 1, [Validators.required, Validators.min(1)]],
      allocatedVINs: [vehicle?.allocatedVINs || []]
    });

    this.vehicles.push(vehicleGroup);
  }

  removeVehicle(index: number): void {
    this.vehicles.removeAt(index);
  }

  calculateGrandTotal(): void {
    const total = this.orderForm.get('totalAmount')?.value || 0;
    const tax = this.orderForm.get('taxAmount')?.value || 0;
    const grandTotal = total + tax;
    this.orderForm.patchValue({ grandTotal }, { emitEvent: false });
  }

  onCompanyChange(customerId: number): void {
    const company = this.companies.find(c => c.id === customerId);
    if (company) {
      this.orderForm.patchValue({ creditLimit: company.creditLimit });
    }

    // Load quotations for this company
    this.quotations = this.quotations.filter(q => q.customerId === customerId);
  }

  checkCreditLimit(): void {
    const customerId = this.orderForm.get('customerId')?.value;
    const requestedAmount = this.orderForm.get('grandTotal')?.value;

    if (!customerId || !requestedAmount) {
      this.showError(this.translate.instant('COMMON.PLEASE_FILL_REQUIRED_FIELDS'));
      return;
    }

    this.sharikatService.checkCreditLimit({ customerId, requestedAmount }).subscribe({
      next: (result) => {
        this.creditCheckResult = result;
        this.requiresApproval = result.requiresApproval;

        if (result.requiresApproval) {
          this.showError(
            `${this.translate.instant('SALES_LIFECYCLE.SHARIKAT.CREDIT_LIMIT_EXCEEDED')}: ${result.availableCredit} SAR`
          );
        } else {
          this.showSuccess(this.translate.instant('SALES_LIFECYCLE.SHARIKAT.CREDIT_APPROVED'));
        }
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to check credit limit');
      }
    });
  }

  saveOrder(): void {
    if (this.orderForm.invalid) {
      this.markFormGroupTouched(this.orderForm);
      this.showError(this.translate.instant('COMMON.PLEASE_FILL_REQUIRED_FIELDS'));
      return;
    }

    const dto: CreateSharikatSalesOrderDto = {
      ...this.orderForm.getRawValue(),
      vehicles: this.vehicles.value
    };

    this.isSaving = true;

    const request = this.isEditMode
      ? this.sharikatService.update(this.orderId!, dto)
      : this.sharikatService.create(dto);

    request.subscribe({
      next: (order) => {
        this.showSuccess(
          this.isEditMode
            ? this.translate.instant('SALES_LIFECYCLE.SHARIKAT.ORDER_UPDATED')
            : this.translate.instant('SALES_LIFECYCLE.SHARIKAT.ORDER_CREATED')
        );
        this.router.navigate(['/sales/lifecycle']);
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to save order');
        this.isSaving = false;
      }
    });
  }

  allocateVehicles(): void {
    if (!this.orderId) return;

    const vehicleAllocations = this.vehicles.value;

    this.sharikatService.allocateVehicles(this.orderId, vehicleAllocations).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.SHARIKAT.VEHICLES_ALLOCATED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to allocate vehicles');
      }
    });
  }

  submitForApproval(): void {
    if (!this.orderId) return;

    this.sharikatService.submitForApproval(this.orderId).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.SHARIKAT.SUBMITTED_FOR_APPROVAL'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to submit for approval');
      }
    });
  }

  approveOrder(): void {
    if (!this.orderId) return;

    this.sharikatService.approve(this.orderId).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.SHARIKAT.ORDER_APPROVED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to approve order');
      }
    });
  }

  uploadPurchaseOrder(event: any): void {
    if (!this.orderId) return;

    const file = event.target.files[0];
    if (!file) return;

    this.sharikatService.uploadPurchaseOrder(this.orderId, file).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.SHARIKAT.PO_UPLOADED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to upload purchase order');
      }
    });
  }

  canEdit(): boolean {
    return !this.order || InvoiceStatusHelper.canEdit(this.order.status);
  }

  canApprove(): boolean {
    return this.order ? InvoiceStatusHelper.canApprove(this.order.status) : false;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  goBack(): void {
    this.router.navigate(['/sales/lifecycle']);
  }
}
