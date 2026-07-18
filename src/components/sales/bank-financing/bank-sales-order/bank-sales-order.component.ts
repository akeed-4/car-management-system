import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';

/**
 * Financing review/confirmation step between Bank Approval and Sales Invoice.
 * Displays the approved BankQuotation as a read-only financing summary + vehicle
 * line. "Proceed to Sales Invoice" confirms it into a Bank Sales Order (generating
 * an order number server-side) and hands off to the Sales Invoice step. No separate
 * CustomerOrder row is created: the bank end-user has no Customer record yet at this
 * stage (one is only resolved/created at invoice finalization), so the order is
 * tracked as an orderNumber/orderDate on the BankQuotation itself.
 */
@Component({
  selector: 'app-bank-sales-order',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    NgxMatSelectSearchModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './bank-sales-order.component.html',
  styleUrls: ['./bank-sales-order.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankSalesOrderComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  approval = signal<BankQuotation | null>(null);
  loading = signal(false);
  saving = signal(false);

  // ==================== Approval lookup ====================
  approvalOptions = signal<BankQuotation[]>([]);
  approvalOptionsLoading = signal(false);
  approvalLookupControl = new FormControl<number | null>(null);
  approvalLookupFilterCtrl = new FormControl('');
  private approvalLookupFilterSignal = toSignal(this.approvalLookupFilterCtrl.valueChanges, { initialValue: '' });

  filteredApprovalOptions = computed(() => {
    const filter = (this.approvalLookupFilterSignal() || '').toLowerCase().trim();
    const options = this.approvalOptions();
    if (!filter) {
      return options;
    }
    return options.filter(a =>
      a.quotationNumber?.toLowerCase().includes(filter) ||
      a.endUserName?.toLowerCase().includes(filter) ||
      a.bankName?.toLowerCase().includes(filter)
    );
  });

  vehicleLines = computed(() => {
    const approval = this.approval();
    return approval ? [{ carDescription: approval.carDescription, vin: approval.vin, vehiclePrice: approval.vehiclePrice }] : [];
  });

  downPayment = computed(() => this.approval()?.downPayment || 0);
  financedAmount = computed(() => this.approval()?.approvedFinancingAmount || 0);
  netFinanced = computed(() => Math.max(this.financedAmount() - this.downPayment(), 0));

  ngOnInit(): void {
    this.loadApprovalOptions();

    this.approvalLookupControl.valueChanges.subscribe(id => {
      if (id) {
        this.loadApproval(id);
      } else {
        this.approval.set(null);
      }
    });

    const approvalId = Number(this.route.snapshot.paramMap.get('id')) || Number(this.route.snapshot.queryParamMap.get('approvalId'));
    if (approvalId) {
      this.approvalLookupControl.setValue(approvalId, { emitEvent: false });
      this.loadApproval(approvalId);
    }
  }

  

  private loadApprovalOptions(): void {
    this.approvalOptionsLoading.set(true);
    this.bankFinancingService.getAllBankQuotations().subscribe({
      next: (approvals: any) => {
        this.approvalOptions.set(approvals.data || approvals || []);
        this.approvalOptionsLoading.set(false);
      },
      error: () => {
        this.approvalOptionsLoading.set(false);
        this.notificationService.showError('BANK_FINANCING.APPROVALS_LOAD_FAILED');
      }
    });
  }

  private loadApproval(id: number): void {
    this.loading.set(true);
    this.bankFinancingService.getQuotationById(id).subscribe({
      next: quotation => {
        this.approval.set(quotation);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.approval.set(null);
        this.notificationService.showError('BANK_FINANCING.APPROVAL_LOAD_FAILED');
      }
    });
  }

  clearApprovalLookup(): void {
    this.approvalLookupControl.setValue(null);
  }

  get isApproved(): boolean {
    return this.approval()?.status === 'Bank_Approved';
  }

  proceedToInvoice(): void {
    const approval = this.approval();
    if (!approval || !this.isApproved || this.saving()) {
      return;
    }

    if (approval.orderNumber) {
      // Order already confirmed on a previous visit -- don't create a duplicate, just hand off.
      this.router.navigate(['/sales/bank/invoices/new'], { queryParams: { orderId: approval.id } });
      return;
    }

    this.saving.set(true);
    this.bankFinancingService.createOrder({ bankQuotationId: approval.id, userId: 1 }).subscribe({
      next: order => {
        this.saving.set(false);
        this.approval.set(order);
        this.notificationService.showSuccess('BANK_FINANCING.ORDER_CREATED');
        this.router.navigate(['/sales/bank/invoices/new'], { queryParams: { orderId: order.id } });
      },
      error: () => {
        this.saving.set(false);
        this.notificationService.showError('BANK_FINANCING.ORDER_CREATE_FAILED');
      }
    });
  }
}
