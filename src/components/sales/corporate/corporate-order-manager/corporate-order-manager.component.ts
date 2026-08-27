import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, Injector } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CorporateFleetService, CreditSummary } from '../../../../services/corporate-fleet.service';
import { StoreService } from '../../../../services/store.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { StoreAccountingConfigurationService } from '../../../../services/store-accounting-configuration.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateQuotation } from '../../../../models/corporate/corporate-quotation.model';
import { CreditUtilizationWidgetComponent } from './credit-utilization-widget/credit-utilization-widget.component';
import { warnIfStoreNotConfigured } from '../../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { BranchContextService } from '../../../../services/branch-context.service';
import { scopeStoresToCurrentBranch } from '../../../../models/branch-scoped-stores.util';

@Component({
  selector: 'app-corporate-order-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatGridListModule,
    MatDialogModule,
    DxDataGridModule,
    TranslateModule,
    CreditUtilizationWidgetComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './corporate-order-manager.component.html',
  styleUrls: ['./corporate-order-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateOrderManagerComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private storeService = inject(StoreService);
  private currentSettingService = inject(CurrentSettingService);
  private storeAccountingConfigService = inject(StoreAccountingConfigurationService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private branchContext = inject(BranchContextService);
  private injector = inject(Injector);

  cardLayout3 = this.currentSettingService.getCardLayout(3);
  /** Store dropdown options scoped to the caller's current branch -- this form is create-only
   *  (no edit mode), so there is no already-saved store to preserve. */
  stores = computed(() => scopeStoresToCurrentBranch(this.storeService.stores$(), this.branchContext.current()?.branchId, null));

  quotation = signal<CorporateQuotation | null>(null);
  creditSummary = signal<CreditSummary | null>(null);
  loading = signal(false);
  submitting = signal(false);

  orderForm!: FormGroup;

  pendingQuotations = signal<CorporateQuotation[]>([]);

  ngOnInit(): void {
    this.orderForm = new FormGroup({
      quotationId: new FormControl<number | null>(null, Validators.required),
      customerPoReference: new FormControl('', Validators.required),
      paymentTerms: new FormControl('', Validators.required),
      expectedDeliveryDate: new FormControl(null),
      salesRepresentative: new FormControl(''),
      storeId: new FormControl<number | null>(null, Validators.required),
      notes: new FormControl('')
    });

    this.orderForm.get('quotationId')?.valueChanges.subscribe(id => {
      if (id) {
        this.loadQuotation(id);
      } else {
        this.quotation.set(null);
        this.creditSummary.set(null);
      }
    });
    this.loadPendingQuotations();

    const quotationId = Number(this.route.snapshot.queryParamMap.get('quotationId'));
    if (quotationId) {
      this.orderForm.patchValue({ quotationId });
    }

    // Auto-select the store once the branch-scoped list resolves to exactly one option, so a
    // user whose branch has a single store never has to manually pick it.
    effect(() => {
      const options = this.stores();
      const storeIdControl = this.orderForm.get('storeId');
      if (options.length === 1 && !storeIdControl?.value && !storeIdControl?.dirty) {
        storeIdControl?.setValue(options[0].id);
        this.onStoreSelectionChange(options[0].id);
      }
    }, { injector: this.injector });
  }

  onStoreSelectionChange(storeId: number | null): void {
    const store = this.stores().find(s => s.id === storeId);
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, store?.nameAr ?? '').subscribe();
  }

  private loadPendingQuotations(): void {
    this.corporateFleetService.getSubmittedQuotations().subscribe({
      next: (quotations: any) => this.pendingQuotations.set(quotations.data),
      error: () => this.notificationService.showError('CORPORATE.ORDERS_LOAD_FAILED')
    });
  }

  private loadQuotation(quotationId: number): void {
    debugger
    this.loading.set(true);
    this.corporateFleetService.getQuotationById(quotationId).subscribe({
      next: (quotation: any) => {
        this.quotation.set(quotation.data);
        this.loading.set(false);
        debugger
        this.corporateFleetService.getCreditSummary(quotation.data.customerId).subscribe({
          next: (summary: any) => this.creditSummary.set(summary.data),
          error: () => {}
        });
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.QUOTATION_LOAD_FAILED');
      }
    });
  }

  get exceedsCreditLimit(): boolean {
    return this.creditSummary() ? !this.creditSummary()!.isApproved : false;
  }

  get isFormValid(): boolean {
    return this.orderForm.valid && !!this.quotation();
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.quotation()?.id) {
      return;
    }

    const raw = this.orderForm.getRawValue();
    const branchId = this.stores().find(s => s.id === raw.storeId)?.branchId;
    if (!branchId) {
      this.notificationService.showError('CORPORATE.ORDER_CREATE_FAILED');
      return;
    }

    this.submitting.set(true);

    this.corporateFleetService
      .createOrder({
        corporateQuotationId: this.quotation()!.id!,
        customerPoReference: raw.customerPoReference,
        paymentTerms: raw.paymentTerms,
        expectedDeliveryDate: raw.expectedDeliveryDate ? new Date(raw.expectedDeliveryDate).toISOString() : undefined,
        salesRepresentative: raw.salesRepresentative || undefined,
        notes: raw.notes || undefined,
        branchId,
        userId: 1
      })
      .subscribe({
        next: order => {
          this.submitting.set(false);
          this.notificationService.showSuccess('CORPORATE.ORDER_CREATED');
          this.router.navigate(['/sales/corporate/orders/view', order.id]);
        },
        error: (err) => {
          this.submitting.set(false);
          if (err?.status === 422) {
            this.notificationService.showError('CORPORATE.CREDIT_LIMIT_EXCEEDED');
          } else {
            this.notificationService.showError(err?.error?.message || 'CORPORATE.ORDER_CREATE_FAILED');
          }
        }
      });
  }
}
