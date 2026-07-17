import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { AccountingService } from '../../../accounting/accounting.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { OrderFulfillmentProgress, RemainingVinCandidate } from '../../../../models/corporate/corporate-dispatch.model';
import { CorporateOrder } from '../../../../models/corporate/corporate-order.model';
import { DocumentChecklistComponent, ChecklistItem } from '../../shared/document-checklist/document-checklist.component';
import { SignaturePadComponent } from '../../shared/signature-pad/signature-pad.component';
import { AttachmentUploaderComponent } from '../../shared/attachment-uploader/attachment-uploader.component';

const VAT_RATE = 0.15;

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { label: 'CORPORATE.CHECKLIST_KEYS', checked: false },
  { label: 'CORPORATE.CHECKLIST_SPARE_TIRE', checked: false },
  { label: 'CORPORATE.CHECKLIST_OWNER_MANUAL', checked: false },
  { label: 'CORPORATE.CHECKLIST_EXTERIOR_INSPECTED', checked: false },
  { label: 'CORPORATE.CHECKLIST_FUEL_LEVEL', checked: false }
];

@Component({
  selector: 'app-corporate-fleet-dispatcher',
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
    MatProgressBarModule,
    DxDataGridModule,
    TranslateModule,
    DocumentChecklistComponent,
    SignaturePadComponent,
    AttachmentUploaderComponent
  ],
  templateUrl: './corporate-fleet-dispatcher.component.html',
  styleUrls: ['./corporate-fleet-dispatcher.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateFleetDispatcherComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private accountingService = inject(AccountingService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  @ViewChild(DxDataGridComponent) grid?: DxDataGridComponent;
  @ViewChild(AttachmentUploaderComponent) attachmentUploader?: AttachmentUploaderComponent;

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  orderId: number | null = null;
  pendingOrders = signal<CorporateOrder[]>([]);
  progress = signal<OrderFulfillmentProgress | null>(null);
  remainingVins = signal<RemainingVinCandidate[]>([]);
  selectedCarIds = signal<number[]>([]);

  debitAccounts = signal<any[]>([]);
  creditAccounts = signal<any[]>([]);
  debitAccountId: number | null = null;
  creditAccountId: number | null = null;

  receiverName = '';
  receiverNationalId = '';
  receiverPhone = '';
  driverName = '';
  notes = '';
  signatureData: string | null = null;
  checklistItems = DEFAULT_CHECKLIST;
  currentChecklist = signal<ChecklistItem[]>(DEFAULT_CHECKLIST);

  submitting = signal(false);
  lastResult = signal<{ deliveryNoteIds: number[]; invoiceNumber: string } | null>(null);

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.queryParamMap.get('orderId')) || null;
    if (this.orderId) {
      this.loadData(this.orderId);
    }
    this.loadPendingOrders();

    this.accountingService.getAccountsByCategory('debit').subscribe(accounts => this.debitAccounts.set(accounts));
    this.accountingService.getAccountsByCategory('credit').subscribe(accounts => this.creditAccounts.set(accounts));
  }

  private loadPendingOrders(): void {
    this.corporateFleetService.getApprovedOrders().subscribe({
      next: (orders: any) => this.pendingOrders.set(orders.data || orders || []),
      error: () => this.notificationService.showError('CORPORATE.ORDERS_LOAD_FAILED')
    });
  }

  onOrderSelected(id: number | null): void {
    debugger
    this.orderId = id;
    if (id) {
      this.loadData(id);
    } else {
      this.progress.set(null);
      this.remainingVins.set([]);
      this.selectedCarIds.set([]);
    }
  }

  private loadData(orderId: number): void {
    this.corporateFleetService.getFulfillmentProgress(orderId).subscribe({
      next: (progress: any) => this.progress.set(progress.data),
      error: () => this.notificationService.showError('CORPORATE.FULFILLMENT_LOAD_FAILED')
    });

    this.corporateFleetService.getRemainingVinsForOrder(orderId).subscribe({
      next: (vins: any) => this.remainingVins.set(vins.data || vins || []),
      error: () => this.notificationService.showError('CORPORATE.REMAINING_VINS_LOAD_FAILED')
    });
  }

  onSelectionChanged(event: any): void {
    this.selectedCarIds.set((event.selectedRowKeys as number[]) || []);
  }

  onChecklistChange(items: ChecklistItem[]): void {
    this.currentChecklist.set(items);
  }

  onSignatureChange(signature: string | null): void {
    this.signatureData = signature;
  }

  selectedVehicles = computed(() =>
    this.remainingVins().filter(v => this.selectedCarIds().includes(v.carId))
  );

  subtotal = computed(() => this.selectedVehicles().reduce((sum, v) => sum + v.unitPrice, 0));
  vatAmount = computed(() => this.subtotal() * VAT_RATE);
  grandTotal = computed(() => this.subtotal() + this.vatAmount());

  get isFormValid(): boolean {
    return (
      !!this.orderId &&
      this.selectedCarIds().length > 0 &&
      !!this.debitAccountId &&
      !!this.creditAccountId &&
      !!this.receiverName &&
      !!this.signatureData
    );
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.orderId) {
      if (this.selectedCarIds().length === 0) {
        this.notificationService.showError('CORPORATE.SELECT_AT_LEAST_ONE_VEHICLE');
      } else if (!this.signatureData) {
        this.notificationService.showError('BANK_FINANCING.SIGNATURE_REQUIRED');
      }
      return;
    }

    this.submitting.set(true);
    this.corporateFleetService
      .processBatch({
        customerOrderId: this.orderId,
        carIds: this.selectedCarIds(),
        debitAccountId: this.debitAccountId!,
        creditAccountId: this.creditAccountId!,
        receiverName: this.receiverName,
        receiverNationalId: this.receiverNationalId || undefined,
        receiverPhone: this.receiverPhone || undefined,
        driverName: this.driverName || undefined,
        signatureData: this.signatureData || undefined,
        checklistJson: JSON.stringify(this.currentChecklist()),
        notes: this.notes || undefined,
        userId: 1
      })
      .subscribe({
        next: result => {
          this.submitting.set(false);
          this.notificationService.showSuccess('CORPORATE.DELIVERY_COMPLETED');
          const deliveryNoteIds = result.deliveryNotes.map(dn => dn.id);
          this.lastResult.set({ deliveryNoteIds, invoiceNumber: result.invoice.invoiceNumber });
          if (this.attachmentUploader && deliveryNoteIds.length > 0) {
            this.attachmentUploader.uploadPending(deliveryNoteIds[0]);
          }
          this.selectedCarIds.set([]);
          this.loadData(this.orderId!);
        },
        error: () => {
          this.submitting.set(false);
          this.notificationService.showError('CORPORATE.DELIVERY_FAILED');
        }
      });
  }
}
