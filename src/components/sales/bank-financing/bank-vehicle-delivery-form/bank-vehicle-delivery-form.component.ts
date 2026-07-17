import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankOrderDeliveryDetails, BankOrderLookup } from '../../../../models/bank-financing/bank-vehicle-delivery.model';
import { DocumentChecklistComponent, ChecklistItem } from '../../shared/document-checklist/document-checklist.component';
import { SignaturePadComponent } from '../../shared/signature-pad/signature-pad.component';
import { AttachmentUploaderComponent } from '../../shared/attachment-uploader/attachment-uploader.component';

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { label: 'CORPORATE.CHECKLIST_KEYS', checked: false },
  { label: 'CORPORATE.CHECKLIST_SPARE_TIRE', checked: false },
  { label: 'CORPORATE.CHECKLIST_OWNER_MANUAL', checked: false },
  { label: 'CORPORATE.CHECKLIST_EXTERIOR_INSPECTED', checked: false },
  { label: 'CORPORATE.CHECKLIST_FUEL_LEVEL', checked: false }
];

interface DeliveryLineItem {
  carId: number;
  vin: string;
  carDescription: string;
  unitPrice: number;
  orderedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  quantityToDeliver: number;
}

@Component({
  selector: 'app-bank-vehicle-delivery-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatGridListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    DxDataGridModule,
    TranslateModule,
    DocumentChecklistComponent,
    SignaturePadComponent,
    AttachmentUploaderComponent
  ],
  templateUrl: './bank-vehicle-delivery-form.component.html',
  styleUrls: ['./bank-vehicle-delivery-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankVehicleDeliveryFormComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(AttachmentUploaderComponent) attachmentUploader?: AttachmentUploaderComponent;

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  eligibleOrders = signal<BankOrderLookup[]>([]);
  ordersLoading = signal(false);

  orderId: number | null = null;
  orderDetails = signal<BankOrderDeliveryDetails | null>(null);
  orderLoading = signal(false);

  /** Only vehicles still eligible for delivery -- filtered defensively even though the
   * order lookup above already excludes fully-delivered orders. Plain (non-signal) array,
   * mutated in place by DevExtreme's cell editing -- mirrors the CarsReceiptNoteForm/GRN
   * pattern of manually triggering change detection after each edit. */
  lineItems: DeliveryLineItem[] = [];
  totalValue = signal(0);

  receiverName = '';
  receiverNationalId = '';
  receiverPhone = '';
  driverName = '';
  notes = '';
  signatureData: string | null = null;
  checklistItems = DEFAULT_CHECKLIST;
  currentChecklist = signal<ChecklistItem[]>(DEFAULT_CHECKLIST);

  submitting = signal(false);

  ngOnInit(): void {
    this.loadEligibleOrders();
  }

  private loadEligibleOrders(): void {
    this.ordersLoading.set(true);
    this.bankFinancingService.getOrdersEligibleForDelivery().subscribe({
      next: orders => {
        this.eligibleOrders.set(orders || []);
        this.ordersLoading.set(false);
      },
      error: () => {
        this.ordersLoading.set(false);
        this.notificationService.showError('BANK_FINANCING.ORDERS_LOAD_FAILED');
      }
    });
  }

  onOrderSelected(id: number | null): void {
    this.orderId = id;
    this.orderDetails.set(null);
    this.lineItems = [];
    this.totalValue.set(0);
    if (id) {
      this.loadOrderDetails(id);
    }
  }

  private loadOrderDetails(id: number): void {
    this.orderLoading.set(true);
    this.bankFinancingService.getOrderDeliveryDetails(id).subscribe({
      next: details => {
        this.lineItems = details.vehicles
          .filter(v => v.remainingQuantity > 0)
          .map(v => ({
            carId: v.carId,
            vin: v.vin,
            carDescription: v.carDescription,
            unitPrice: v.unitPrice,
            orderedQuantity: v.orderedQuantity,
            deliveredQuantity: v.deliveredQuantity,
            remainingQuantity: v.remainingQuantity,
            quantityToDeliver: v.remainingQuantity
          }));
        this.recomputeTotal();
        this.orderDetails.set(details);
        this.orderLoading.set(false);
      },
      error: () => {
        this.orderLoading.set(false);
        this.notificationService.showError('BANK_FINANCING.ORDER_LOAD_FAILED');
      }
    });
  }

  quantityToDeliverSetCellValue = (newData: any, value: number, currentRowData: DeliveryLineItem): void => {
    if (value > currentRowData.remainingQuantity) {
      this.notificationService.showWarning('BANK_FINANCING.MAX_QTY_WARNING');
      return;
    }
    newData.quantityToDeliver = Math.max(value, 0);
    setTimeout(() => {
      this.recomputeTotal();
      this.cdr.markForCheck();
    });
  };

  private recomputeTotal(): void {
    this.totalValue.set(
      this.lineItems.reduce((sum, l) => sum + (l.quantityToDeliver > 0 ? l.unitPrice * l.quantityToDeliver : 0), 0)
    );
  }

  onChecklistChange(items: ChecklistItem[]): void {
    this.currentChecklist.set(items);
  }

  onSignatureChange(signature: string | null): void {
    this.signatureData = signature;
  }

  get hasSelectedVehicle(): boolean {
    return this.lineItems.some(l => l.quantityToDeliver > 0);
  }

  get isFormValid(): boolean {
    return (
      !!this.orderId &&
      !!this.receiverName &&
      this.hasSelectedVehicle &&
      this.lineItems.every(l => l.quantityToDeliver <= l.remainingQuantity)
    );
  }

  onSubmit(): void {
    if (!this.orderId) {
      return;
    }

    const linesToDeliver = this.lineItems.filter(l => l.quantityToDeliver > 0);
    if (linesToDeliver.length === 0) {
      this.notificationService.showError('BANK_FINANCING.NOTHING_TO_DELIVER');
      return;
    }
    if (!this.receiverName) {
      this.notificationService.showError('CORPORATE.RECEIVER_NAME');
      return;
    }
    if (linesToDeliver.some(l => l.quantityToDeliver > l.remainingQuantity)) {
      this.notificationService.showError('BANK_FINANCING.MAX_QTY_WARNING');
      return;
    }

    this.submitting.set(true);
    this.bankFinancingService
      .createVehicleDelivery({
        bankQuotationId: this.orderId,
        receiverName: this.receiverName,
        receiverNationalId: this.receiverNationalId || undefined,
        receiverPhone: this.receiverPhone || undefined,
        driverName: this.driverName || undefined,
        signatureData: this.signatureData || undefined,
        checklistJson: JSON.stringify(this.currentChecklist()),
        notes: this.notes || undefined,
        userId: 1,
        items: linesToDeliver.map(l => ({ carId: l.carId, deliveredQuantity: l.quantityToDeliver }))
      })
      .subscribe({
        next: delivery => {
          this.submitting.set(false);
          this.notificationService.showSuccess('BANK_FINANCING.DELIVERY_COMPLETED');
          if (this.attachmentUploader) {
            this.attachmentUploader.uploadPending(delivery.id);
          }
          this.router.navigate(['/sales/bank/deliveries/view', delivery.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.notificationService.showError('BANK_FINANCING.DELIVERY_FAILED');
        }
      });
  }
}
