import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AfradSalesService } from '../../../services/afrad-sales.service';
import { AfradSalesOrder, CreateAfradSalesOrderDto, ReserveVehicleDto } from '../../../models/sales-lifecycle/afrad-sales-order.model';
import { InvoiceStatus, InvoiceStatusHelper } from '../../../models/enums/invoice-status.enum';

/**
 * Afrad Sales Order Form Component
 * Create and edit individual/retail sales orders
 */
@Component({
  selector: 'app-afrad-sales-form',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './afrad-sales-form.component.html',
  styleUrls: ['./afrad-sales-form.component.css']
})
export class AfradSalesFormComponent implements OnInit {
  orderForm!: FormGroup;
  reservationForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  orderId?: number;
  order?: AfradSalesOrder;

  // Dropdown data
  customers: any[] = [];
  vehicles: any[] = [];
  branches: any[] = [];
  banks: any[] = [];
  advanceVouchers: any[] = [];

  InvoiceStatus = InvoiceStatus;
  InvoiceStatusHelper = InvoiceStatusHelper;

  constructor(
    private fb: FormBuilder,
    private afradService: AfradSalesService,
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
  }

  initializeForms(): void {
    this.orderForm = this.fb.group({
      customerId: [null, Validators.required],
      vehicleId: [null, Validators.required],
      branchId: [null, Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      advancePaymentAmount: [0, [Validators.required, Validators.min(0)]],
      remainingAmount: [{ value: 0, disabled: true }],
      isFinanced: [false],
      bankId: [null],
      financeTerm: [null],
      profitRate: [null],
      monthlyInstallment: [null],
      notes: ['']
    });

    this.reservationForm = this.fb.group({
      advancePaymentVoucherId: [null, Validators.required],
      reservationNotes: ['']
    });

    // Auto-calculate remaining amount
    this.orderForm.get('totalAmount')?.valueChanges.subscribe(() => this.calculateRemainingAmount());
    this.orderForm.get('advancePaymentAmount')?.valueChanges.subscribe(() => this.calculateRemainingAmount());

    // Toggle finance fields
    this.orderForm.get('isFinanced')?.valueChanges.subscribe(isFinanced => {
      const financingControls = ['bankId', 'financeTerm', 'profitRate', 'monthlyInstallment'];
      financingControls.forEach(control => {
        const formControl = this.orderForm.get(control);
        if (isFinanced) {
          formControl?.setValidators(Validators.required);
        } else {
          formControl?.clearValidators();
          formControl?.setValue(null);
        }
        formControl?.updateValueAndValidity();
      });
    });
  }

  loadReferenceData(): void {
    // Load customers, vehicles, branches, banks
    // In production, these would come from respective services
    this.customers = [
      { id: 1, nameAr: 'محمد أحمد', nameEn: 'Mohammed Ahmed', phone: '0501234567' },
      { id: 2, nameAr: 'علي حسن', nameEn: 'Ali Hassan', phone: '0509876543' }
    ];

    this.vehicles = [
      { id: 1, vin: 'VIN123456789', modelNameAr: 'كامري 2024', modelNameEn: 'Camry 2024', price: 100000, available: true },
      { id: 2, vin: 'VIN987654321', modelNameAr: 'كورولا 2024', modelNameEn: 'Corolla 2024', price: 85000, available: true }
    ];

    this.branches = [
      { id: 1, nameAr: 'فرع الرياض الرئيسي', nameEn: 'Riyadh Main Branch' },
      { id: 2, nameAr: 'فرع جدة', nameEn: 'Jeddah Branch' }
    ];

    this.banks = [
      { id: 1, nameAr: 'الراجحي', nameEn: 'Al Rajhi Bank' },
      { id: 2, nameAr: 'الأهلي', nameEn: 'Al Ahli Bank' }
    ];
  }

  loadOrder(): void {
    if (!this.orderId) return;

    this.isLoading = true;
    this.afradService.getById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.orderForm.patchValue({
          customerId: order.customerId,
          vehicleId: order.vehicleId,
          branchId: order.branchId,
          totalAmount: order.totalAmount,
          advancePaymentAmount: order.advancePaymentAmount,
          isFinanced: order.isFinanced,
          bankId: order.financeBankId,
          financeTerm: order.financeTerm,
          profitRate: 0,
          monthlyInstallment: order.monthlyInstallment,
          notes: order.notes
        });

        // Load advance payment vouchers for this order
        if (order.customerId) {
          this.loadAdvanceVouchers(order.customerId);
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Failed to load order');
        this.isLoading = false;
      }
    });
  }

  loadAdvanceVouchers(customerId: number): void {
    this.afradService.getAllVouchers({ customerId }).subscribe({
      next: (vouchers) => {
        this.advanceVouchers = vouchers;
      }
    });
  }

  calculateRemainingAmount(): void {
    const total = this.orderForm.get('totalAmount')?.value || 0;
    const advance = this.orderForm.get('advancePaymentAmount')?.value || 0;
    const remaining = total - advance;
    this.orderForm.patchValue({ remainingAmount: remaining }, { emitEvent: false });
  }

  onVehicleChange(vehicleId: number): void {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      this.orderForm.patchValue({ totalAmount: vehicle.price });
    }
  }

  onCustomerChange(customerId: number): void {
    this.loadAdvanceVouchers(customerId);
  }

  saveOrder(): void {
    if (this.orderForm.invalid) {
      this.markFormGroupTouched(this.orderForm);
      this.showError(this.translate.instant('COMMON.PLEASE_FILL_REQUIRED_FIELDS'));
      return;
    }

    const dto: CreateAfradSalesOrderDto = this.orderForm.getRawValue();
    this.isSaving = true;

    const request = this.isEditMode
      ? this.afradService.update(this.orderId!, dto)
      : this.afradService.create(dto);

    request.subscribe({
      next: (order) => {
        this.showSuccess(
          this.isEditMode
            ? this.translate.instant('SALES_LIFECYCLE.AFRAD.ORDER_UPDATED')
            : this.translate.instant('SALES_LIFECYCLE.AFRAD.ORDER_CREATED')
        );
        this.router.navigate(['/sales/lifecycle']);
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to save order');
        this.isSaving = false;
      }
    });
  }

  reserveVehicle(): void {
    if (this.reservationForm.invalid || !this.orderId) {
      this.markFormGroupTouched(this.reservationForm);
      return;
    }

    const dto: ReserveVehicleDto = {
      orderId: this.orderId,
      advancePaymentVoucherId: this.reservationForm.get('advancePaymentVoucherId')?.value
    };

    this.afradService.reserveVehicle(dto).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.AFRAD.VEHICLE_RESERVED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to reserve vehicle');
      }
    });
  }

  approveOrder(): void {
    if (!this.orderId) return;

    this.afradService.approve(this.orderId).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.AFRAD.ORDER_APPROVED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to approve order');
      }
    });
  }

  cancelOrder(): void {
    if (!this.orderId) return;

    this.afradService.cancel(this.orderId, 'Order cancelled by user').subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.AFRAD.ORDER_CANCELLED'));
        this.router.navigate(['/sales/lifecycle']);
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to cancel order');
      }
    });
  }

  canEdit(): boolean {
    return !this.order || this.order.status === 'Draft' || this.order.status === 'Reserved';
  }

  canApprove(): boolean {
    return this.order ? (this.order.status === 'Reserved' || this.order.status === 'Draft') : false;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
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
