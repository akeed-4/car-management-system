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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../services/bank-financing.service';
import { AccountingService } from '../../accounting/accounting.service';
import { openCreateAccountDialog } from '../../accounting/create-account-dialog.helper';
import { CustomerService } from '../../../services/customer.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankQuotation } from '../../../models/bank-financing/bank-quotation.model';
import { UninvoicedDeliveryLookup } from '../../../models/sales/uninvoiced-delivery.model';
import { SalesInvoiceFormComponent } from '../sales-invoice-form/sales-invoice-form.component';
import { SalesChannel } from '../../../models/enums/sales-channel.enum';
import { SaleType } from '../../../models/sales-enhancements.model';

type InvoiceSource = 'order' | 'delivery';

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
    MatTooltipModule,
    MatDialogModule,
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
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  SalesChannel = SalesChannel;
  SaleType = SaleType;

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  /** Edit mode falls back to the generic invoice form -- unchanged behavior. */
  editId: number | null = null;

  source: InvoiceSource = 'order';

  availableOrders = signal<BankQuotation[]>([]);
  ordersLoading = signal(false);
  selectedOrderId: number | null = null;
  selectedOrder = signal<BankQuotation | null>(null);

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

  // --- Requirement 9: "+ Create Account" from this document -----------------------------------
  openCreateDebitAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.debitAccounts.update(list => [...list, created]);
      this.debitAccountId = created.id;
    });
  }

  openCreateCreditAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.creditAccounts.update(list => [...list, created]);
      this.creditAccountId = created.id;
    });
  }

  ngOnInit(): void {
    this.editId = Number(this.route.snapshot.params['id']) || null;
    if (this.editId) {
      return;
    }

    this.loadAvailableOrders();
    this.loadUninvoicedDeliveries();
    // Debit/Credit selectors must only offer leaf/postable accounts -- parent/grouping accounts
    // are excluded server-side by this endpoint, not filtered client-side from the category list.
    this.accountingService.getPostableAccounts('debit').subscribe(accounts => this.debitAccounts.set(accounts));
    this.accountingService.getPostableAccounts('credit').subscribe(accounts => this.creditAccounts.set(accounts));

    const orderId = Number(this.route.snapshot.queryParamMap.get('orderId')) || null;
    if (orderId) {
      this.source = 'order';
      this.onOrderSelected(orderId);
    }
  }

  onSourceChange(source: InvoiceSource): void {
    this.source = source;
    this.selectedOrderId = null;
    this.selectedOrder.set(null);
    this.selectedDeliveryId = null;
  }

  private loadAvailableOrders(): void {
    this.ordersLoading.set(true);
    this.bankFinancingService.getUninvoicedOrders().subscribe({
      next: orders => {
        this.availableOrders.set(orders || []);
        this.ordersLoading.set(false);
      },
      error: () => {
        this.ordersLoading.set(false);
        this.notificationService.showError('BANK_FINANCING.ORDERS_LOAD_FAILED');
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

  onOrderSelected(id: number | null): void {
    this.selectedOrderId = id;
    this.selectedOrder.set(null);
    if (!id) {
      return;
    }
    this.bankFinancingService.getQuotationById(id).subscribe({
      next: q => this.selectedOrder.set(q),
      error: () => this.notificationService.showError('BANK_FINANCING.ORDER_LOAD_FAILED')
    });
  }

  onDeliverySelected(id: number | null): void {
    this.selectedDeliveryId = id;
  }

  selectedDelivery = computed(() =>
    this.uninvoicedDeliveries().find(d => d.id === this.selectedDeliveryId) || null
  );

  orderVehicleLines = computed(() => {
    const o = this.selectedOrder();
    return o ? [{ carDescription: o.carDescription, vin: o.vin, vehiclePrice: o.vehiclePrice }] : [];
  });

  get isFormValid(): boolean {
    if (!this.debitAccountId || !this.creditAccountId || !this.bankBillingCustomerId || !this.issuedPlateNumber) {
      return false;
    }
    return this.source === 'order' ? !!this.selectedOrderId : !!this.selectedDeliveryId;
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      return;
    }

    this.submitting.set(true);

    const call$ = this.source === 'order'
      ? this.bankFinancingService.finalizeInvoice({
          bankQuotationId: this.selectedOrderId!,
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
