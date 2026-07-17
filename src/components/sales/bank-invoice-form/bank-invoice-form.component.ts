import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../services/bank-financing.service';
import { AccountingService } from '../../accounting/accounting.service';
import { CustomerService } from '../../../services/customer.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankQuotation } from '../../../models/bank-financing/bank-quotation.model';
import { UninvoicedDeliveryLookup } from '../../../models/sales/uninvoiced-delivery.model';
import { SalesInvoiceFormComponent } from '../sales-invoice-form/sales-invoice-form.component';
import { SalesChannel } from '../../../models/enums/sales-channel.enum';
import { SaleType } from '../../../models/sales-enhancements.model';

type InvoiceSource = 'quotation' | 'delivery';

@Component({
  selector: 'app-bank-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    DxDataGridModule,
    TranslateModule,
    SalesInvoiceFormComponent
  ],
  templateUrl: './bank-invoice-form.component.html',
  styleUrls: ['./bank-invoice-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankInvoiceFormComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private accountingService = inject(AccountingService);
  private customerService = inject(CustomerService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  SalesChannel = SalesChannel;
  SaleType = SaleType;

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  /** Edit mode falls back to the generic invoice form -- unchanged behavior. */
  editId: number | null = null;

  source: InvoiceSource = 'quotation';

  approvedQuotations = signal<BankQuotation[]>([]);
  quotationsLoading = signal(false);
  selectedQuotationId: number | null = null;
  selectedQuotation = signal<BankQuotation | null>(null);

  uninvoicedDeliveries = signal<UninvoicedDeliveryLookup[]>([]);
  deliveriesLoading = signal(false);
  selectedDeliveryId: number | null = null;

  customers = this.customerService.customers$;
  debitAccounts = signal<any[]>([]);
  creditAccounts = signal<any[]>([]);
  debitAccountId: number | null = null;
  creditAccountId: number | null = null;
  bankBillingCustomerId: number | null = null;
  issuedPlateNumber = '';

  submitting = signal(false);

  ngOnInit(): void {
    this.editId = Number(this.route.snapshot.params['id']) || null;
    if (this.editId) {
      return;
    }

    this.loadApprovedQuotations();
    this.loadUninvoicedDeliveries();
    this.accountingService.getAccountsByCategory('debit').subscribe(accounts => this.debitAccounts.set(accounts));
    this.accountingService.getAccountsByCategory('credit').subscribe(accounts => this.creditAccounts.set(accounts));
  }

  onSourceChange(source: InvoiceSource): void {
    this.source = source;
    this.selectedQuotationId = null;
    this.selectedQuotation.set(null);
    this.selectedDeliveryId = null;
  }

  private loadApprovedQuotations(): void {
    this.quotationsLoading.set(true);
    this.bankFinancingService.getQuotationsByStatus('Bank_Approved').subscribe({
      next: quotations => {
        this.approvedQuotations.set(quotations || []);
        this.quotationsLoading.set(false);
      },
      error: () => {
        this.quotationsLoading.set(false);
        this.notificationService.showError('BANK_FINANCING.APPROVALS_LOAD_FAILED');
      }
    });
  }

  private loadUninvoicedDeliveries(): void {
    this.deliveriesLoading.set(true);
    this.bankFinancingService.getUninvoicedDeliveries().subscribe({
      next: deliveries => {
        this.uninvoicedDeliveries.set(deliveries || []);
        this.deliveriesLoading.set(false);
      },
      error: () => {
        this.deliveriesLoading.set(false);
        this.notificationService.showError('BANK_FINANCING.DELIVERIES_LOAD_FAILED');
      }
    });
  }

  onQuotationSelected(id: number | null): void {
    this.selectedQuotationId = id;
    this.selectedQuotation.set(null);
    if (!id) {
      return;
    }
    this.bankFinancingService.getQuotationById(id).subscribe({
      next: q => this.selectedQuotation.set(q),
      error: () => this.notificationService.showError('BANK_FINANCING.APPROVAL_LOAD_FAILED')
    });
  }

  onDeliverySelected(id: number | null): void {
    this.selectedDeliveryId = id;
  }

  selectedDelivery = computed(() =>
    this.uninvoicedDeliveries().find(d => d.id === this.selectedDeliveryId) || null
  );

  quotationVehicleLines = computed(() => {
    const q = this.selectedQuotation();
    return q ? [{ carDescription: q.carDescription, vin: q.vin, vehiclePrice: q.vehiclePrice }] : [];
  });

  get isFormValid(): boolean {
    if (!this.debitAccountId || !this.creditAccountId || !this.bankBillingCustomerId || !this.issuedPlateNumber) {
      return false;
    }
    return this.source === 'quotation' ? !!this.selectedQuotationId : !!this.selectedDeliveryId;
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      return;
    }

    this.submitting.set(true);

    const call$ = this.source === 'quotation'
      ? this.bankFinancingService.finalizeInvoice({
          bankQuotationId: this.selectedQuotationId!,
          bankBillingCustomerId: this.bankBillingCustomerId!,
          issuedPlateNumber: this.issuedPlateNumber,
          debitAccountId: this.debitAccountId!,
          creditAccountId: this.creditAccountId!,
          userId: 1
        })
      : this.bankFinancingService.createInvoiceFromDelivery({
          deliveryNoteId: this.selectedDeliveryId!,
          bankBillingCustomerId: this.bankBillingCustomerId!,
          issuedPlateNumber: this.issuedPlateNumber,
          debitAccountId: this.debitAccountId!,
          creditAccountId: this.creditAccountId!,
          userId: 1
        });

    call$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.notificationService.showSuccess('TOAST.ADD_SUCCESS');
        this.router.navigate(['/sales/bank/invoices']);
      },
      error: () => {
        this.submitting.set(false);
        this.notificationService.showError('TOAST.SAVE_ERROR');
      }
    });
  }
}
