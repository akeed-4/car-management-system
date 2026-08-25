import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CorporateFleetService } from '../../../services/corporate-fleet.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateQuotation } from '../../../models/corporate/corporate-quotation.model';
import { UninvoicedDeliveryLookup } from '../../../models/sales/uninvoiced-delivery.model';
import { SalesInvoiceFormComponent } from '../sales-invoice-form/sales-invoice-form.component';
import { SalesChannel } from '../../../models/enums/sales-channel.enum';
import { SaleType } from '../../../models/sales-enhancements.model';

type InvoiceSource = 'quotation' | 'delivery';

@Component({
  selector: 'app-companies-invoice-form',
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
  templateUrl: './companies-invoice-form.component.html',
  styleUrls: ['./companies-invoice-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesInvoiceFormComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
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

  approvedQuotations = signal<CorporateQuotation[]>([]);
  quotationsLoading = signal(false);
  selectedQuotationId: number | null = null;
  selectedQuotation = signal<CorporateQuotation | null>(null);
  quotationLoading = signal(false);

  uninvoicedDeliveries = signal<UninvoicedDeliveryLookup[]>([]);
  deliveriesLoading = signal(false);
  selectedDeliveryIds: number[] = [];

submitting = signal(false);

  ngOnInit(): void {
    this.editId = Number(this.route.snapshot.params['id']) || null;
    if (this.editId) {
      return;
    }

    this.loadApprovedQuotations();
    this.loadUninvoicedDeliveries();
  }

  onSourceChange(source: InvoiceSource): void {
    this.source = source;
    this.selectedQuotationId = null;
    this.selectedQuotation.set(null);
    this.selectedDeliveryIds = [];
  }

  private loadApprovedQuotations(): void {
    this.quotationsLoading.set(true);
    this.corporateFleetService.getSubmittedQuotations().subscribe({
      next: (quotations: any) => {
        this.approvedQuotations.set(quotations.data || quotations || []);
        this.quotationsLoading.set(false);
      },
      error: () => {
        this.quotationsLoading.set(false);
        this.notificationService.showError('CORPORATE.QUOTATIONS_LOAD_FAILED');
      }
    });
  }

  private loadUninvoicedDeliveries(): void {
    this.deliveriesLoading.set(true);
    this.corporateFleetService.getUninvoicedDeliveries().subscribe({
      next: (deliveries: any) => {
        this.uninvoicedDeliveries.set(deliveries.data || deliveries || []);
        this.deliveriesLoading.set(false);
      },
      error: () => {
        this.deliveriesLoading.set(false);
        this.notificationService.showError('CORPORATE.DELIVERIES_LOAD_FAILED');
      }
    });
  }

  onQuotationSelected(id: number | null): void {
    this.selectedQuotationId = id;
    this.selectedQuotation.set(null);
    if (!id) {
      return;
    }
    this.quotationLoading.set(true);
    this.corporateFleetService.getQuotationById(id).subscribe({
      next: (q: any) => {
        this.selectedQuotation.set(q.data || q || null);
        this.quotationLoading.set(false);
      },
      error: () => {
        this.quotationLoading.set(false);
        this.notificationService.showError('CORPORATE.QUOTATION_LOAD_FAILED');
      }
    });
  }

  /** Only deliveries on the same order as the first pick are selectable -- one invoice per customer/order. */
  selectableDeliveries = computed(() => {
    const deliveries = this.uninvoicedDeliveries();
    if (this.selectedDeliveryIds.length === 0) {
      return deliveries;
    }
    const firstOrderId = deliveries.find(d => d.id === this.selectedDeliveryIds[0])?.corporateOrderId;
    return deliveries.filter(d => d.corporateOrderId === firstOrderId);
  });

  onDeliverySelectionChanged(event: any): void {
    this.selectedDeliveryIds = (event.selectedRowKeys as number[]) || [];
  }

  selectedDeliveryLines = computed(() =>
    this.uninvoicedDeliveries().filter(d => this.selectedDeliveryIds.includes(d.id))
  );

  quotationTotal = computed(() => this.selectedQuotation()?.lines.reduce((sum, l) => sum + l.discountedPrice, 0) || 0);
  deliveryTotal = computed(() => this.selectedDeliveryLines().reduce((sum, l) => sum + l.unitPrice, 0));

  get isFormValid(): boolean {
    if (this.source === 'quotation') {
      return !!this.selectedQuotationId;
    }
    return this.selectedDeliveryIds.length > 0;
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      return;
    }

    this.submitting.set(true);

    const call$ = this.source === 'quotation'
      ? this.corporateFleetService.createInvoiceFromQuotation({
          corporateQuotationId: this.selectedQuotationId!,
          userId: 1
        })
      : this.corporateFleetService.createInvoiceFromDelivery({
          deliveryNoteIds: this.selectedDeliveryIds,
          userId: 1
        });

    call$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.notificationService.showSuccess('TOAST.ADD_SUCCESS');
        this.router.navigate(['/sales/corporate/invoices']);
      },
      error: () => {
        this.submitting.set(false);
        this.notificationService.showError('TOAST.SAVE_ERROR');
      }
    });
  }
}
