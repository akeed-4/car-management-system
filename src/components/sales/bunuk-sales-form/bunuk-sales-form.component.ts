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
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BunukSalesService } from '../../../services/bunuk-sales.service';
import { BunukSalesOrder, CreateBunukSalesOrderDto, FinanceDocumentItem, FinanceCalculationResult, UpdateTaameedInfoDto } from '../../../models/sales-lifecycle/bunuk-sales-order.model';
import { InvoiceStatus, InvoiceStatusHelper } from '../../../models/enums/invoice-status.enum';

/**
 * Bunuk Sales Order Form Component
 * Create and edit bank-financed sales orders
 */
@Component({
  selector: 'app-bunuk-sales-form',
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
    MatListModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatBadgeModule,
    TranslateModule
  ],
  templateUrl: './bunuk-sales-form.component.html',
  styleUrls: ['./bunuk-sales-form.component.css']
})
export class BunukSalesFormComponent implements OnInit {
  orderForm!: FormGroup;
  financeForm!: FormGroup;
  taameedForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  orderId?: number;
  order?: BunukSalesOrder;

  // Dropdown data
  customers: any[] = [];
  vehicles: any[] = [];
  banks: any[] = [];
  branches: any[] = [];

  // Finance calculation result
  financeCalculation?: FinanceCalculationResult;

  // Document checklist
  requiredDocuments: FinanceDocumentItem[] = [
    { documentType: 'NationalID', documentName: 'بطاقة الهوية الوطنية', isRequired: true, isReceived: false },
    { documentType: 'SalaryStatement', documentName: 'كشف الراتب', isRequired: true, isReceived: false },
    { documentType: 'BankStatement', documentName: 'كشف حساب بنكي', isRequired: true, isReceived: false },
    { documentType: 'EmploymentLetter', documentName: 'خطاب تعريف بالراتب', isRequired: true, isReceived: false },
    { documentType: 'InsuranceQuote', documentName: 'عرض سعر تأمين', isRequired: false, isReceived: false }
  ];

  InvoiceStatus = InvoiceStatus;
  InvoiceStatusHelper = InvoiceStatusHelper;

  constructor(
    private fb: FormBuilder,
    private bunukService: BunukSalesService,
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
      bankId: [null, Validators.required],
      branchId: [null, Validators.required],
      vehiclePrice: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });

    this.financeForm = this.fb.group({
      downPaymentPercentage: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
      financeTerm: [60, [Validators.required, Validators.min(12), Validators.max(120)]],
      profitRate: [5.5, [Validators.required, Validators.min(0)]],
      adminFees: [500],
      insuranceAmount: [0],
      otherFees: [0]
    });

    this.taameedForm = this.fb.group({
      taameedNumber: ['', Validators.required],
      taameedDate: [null, Validators.required],
      approvedAmount: [0, Validators.required],
      approvedTerm: [0, Validators.required],
      approvedProfitRate: [0, Validators.required],
      bankReferenceNumber: ['']
    });
  }

  loadReferenceData(): void {
    // Load customers, vehicles, banks, branches
    this.customers = [
      { id: 1, nameAr: 'سعيد محمد', nameEn: 'Saeed Mohammed', phone: '0501234567' },
      { id: 2, nameAr: 'فهد عبدالله', nameEn: 'Fahad Abdullah', phone: '0509876543' }
    ];

    this.vehicles = [
      { id: 1, vin: 'VIN123456789', modelNameAr: 'كامري 2024', modelNameEn: 'Camry 2024', price: 100000, available: true },
      { id: 2, vin: 'VIN987654321', modelNameAr: 'أكورد 2024', modelNameEn: 'Accord 2024', price: 95000, available: true }
    ];

    this.banks = [
      { id: 1, nameAr: 'الراجحي', nameEn: 'Al Rajhi Bank', maxFinanceTerm: 84 },
      { id: 2, nameAr: 'الأهلي', nameEn: 'Al Ahli Bank', maxFinanceTerm: 72 },
      { id: 3, nameAr: 'الإنماء', nameEn: 'Alinma Bank', maxFinanceTerm: 60 }
    ];

    this.branches = [
      { id: 1, nameAr: 'فرع الرياض الرئيسي', nameEn: 'Riyadh Main Branch' },
      { id: 2, nameAr: 'فرع جدة', nameEn: 'Jeddah Branch' }
    ];
  }

  loadOrder(): void {
    if (!this.orderId) return;

    this.isLoading = true;
    this.bunukService.getById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.orderForm.patchValue({
          customerId: order.customerId,
          vehicleId: order.vehicleId,
          bankId: order.bankId,
          branchId: order.branchId,
          vehiclePrice: order.vehiclePrice,
          notes: order.notes
        });

        this.financeForm.patchValue({
          downPaymentPercentage: order.downPaymentPercentage,
          financeTerm: order.financeTerm,
          profitRate: order.profitRate,
          adminFees: order.adminFees,
          insuranceAmount: order.insuranceAmount,
          otherFees: order.otherFees
        });

        if (order.taameedNumber) {
          this.taameedForm.patchValue({
            taameedNumber: order.taameedNumber,
            taameedDate: order.taameedDate,
            approvedAmount: order.approvedAmount,
            approvedTerm: order.approvedTerm,
            approvedProfitRate: order.approvedProfitRate,
            bankReferenceNumber: order.bankReferenceNumber
          });
        }

        // Update document checklist
        if (order.documents && order.documents.length > 0) {
          this.requiredDocuments = order.documents;
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Failed to load order');
        this.isLoading = false;
      }
    });
  }

  onVehicleChange(vehicleId: number): void {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      this.orderForm.patchValue({ vehiclePrice: vehicle.price });
    }
  }

  calculateFinance(): void {
    if (this.orderForm.invalid || this.financeForm.invalid) {
      this.markFormGroupTouched(this.orderForm);
      this.markFormGroupTouched(this.financeForm);
      this.showError(this.translate.instant('COMMON.PLEASE_FILL_REQUIRED_FIELDS'));
      return;
    }

    const vehiclePrice = this.orderForm.get('vehiclePrice')?.value;
    const downPaymentPercentage = this.financeForm.get('downPaymentPercentage')?.value;
    const financeTerm = this.financeForm.get('financeTerm')?.value;
    const profitRate = this.financeForm.get('profitRate')?.value;
    const additionalFees = {
      adminFees: this.financeForm.get('adminFees')?.value || 0,
      insuranceAmount: this.financeForm.get('insuranceAmount')?.value || 0,
      otherFees: this.financeForm.get('otherFees')?.value || 0
    };

    this.bunukService.calculateFinance(vehiclePrice, downPaymentPercentage, financeTerm, profitRate, additionalFees).subscribe({
      next: (result) => {
        this.financeCalculation = result;
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.BUNUK.FINANCE_CALCULATED'));
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to calculate finance');
      }
    });
  }

  saveOrder(): void {
    if (this.orderForm.invalid || this.financeForm.invalid) {
      this.markFormGroupTouched(this.orderForm);
      this.markFormGroupTouched(this.financeForm);
      this.showError(this.translate.instant('COMMON.PLEASE_FILL_REQUIRED_FIELDS'));
      return;
    }

    const dto: CreateBunukSalesOrderDto = {
      ...this.orderForm.value,
      ...this.financeForm.value,
      documents: this.requiredDocuments
    };

    this.isSaving = true;

    const request = this.isEditMode
      ? this.bunukService.update(this.orderId!, dto)
      : this.bunukService.create(dto);

    request.subscribe({
      next: (order) => {
        this.orderId = order.id;
        this.isEditMode = true;
        this.showSuccess(
          this.isEditMode
            ? this.translate.instant('SALES_LIFECYCLE.BUNUK.ORDER_UPDATED')
            : this.translate.instant('SALES_LIFECYCLE.BUNUK.ORDER_CREATED')
        );
        this.isSaving = false;
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to save order');
        this.isSaving = false;
      }
    });
  }

  submitFinanceApplication(): void {
    if (!this.orderId) {
      this.showError('Please save the order first');
      return;
    }

    this.bunukService.submitFinanceApplication(this.orderId).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.BUNUK.APPLICATION_SUBMITTED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to submit application');
      }
    });
  }

  updateTaameedInfo(): void {
    if (!this.orderId || this.taameedForm.invalid) {
      this.markFormGroupTouched(this.taameedForm);
      return;
    }

    const dto: UpdateTaameedInfoDto = this.taameedForm.value;

    this.bunukService.updateTaameedInfo(this.orderId, dto).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.BUNUK.TAAMEED_UPDATED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to update Taameed info');
      }
    });
  }

  toggleDocumentStatus(document: FinanceDocumentItem): void {
    document.isReceived = !document.isReceived;
    if (document.isReceived) {
      document.receivedDate = new Date();
    }
  }

  uploadDocument(document: FinanceDocumentItem, event: any): void {
    if (!this.orderId) return;

    const file = event.target.files[0];
    if (!file) return;

    this.bunukService.uploadTaameedDocument(this.orderId, document.documentType, file).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.BUNUK.DOCUMENT_UPLOADED'));
        document.isReceived = true;
        document.receivedDate = new Date();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to upload document');
      }
    });
  }

  approveFinance(): void {
    if (!this.orderId) return;

    this.bunukService.approve(this.orderId).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.BUNUK.FINANCE_APPROVED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to approve finance');
      }
    });
  }

  recordBankSettlement(): void {
    if (!this.orderId) return;

    const settlementAmount = this.financeCalculation?.financedAmount || 0;
    const settlementDate = new Date();

    this.bunukService.recordBankSettlement(this.orderId, settlementAmount, settlementDate, 'Bank settlement').subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('SALES_LIFECYCLE.BUNUK.SETTLEMENT_RECORDED'));
        this.loadOrder();
      },
      error: (error) => {
        this.showError(error.error?.message || 'Failed to record settlement');
      }
    });
  }

  getCompletedDocumentsCount(): number {
    return this.requiredDocuments.filter(d => d.isReceived).length;
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
