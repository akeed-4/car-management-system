import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleSpecsDisplayComponent } from './vehicle-specs-display/vehicle-specs-display.component';
import { RetailService } from '../../../../services/retail.service';
import { SalesService } from '../../../../services/sales.service';
import { InventoryService } from '../../../../services/inventory.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { VehicleSpecs } from '../../../../models/retail/retail-delivery.model';
import { SalesInvoice } from '../../../../models/sales-invoice.model';
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

@Component({
  selector: 'app-retail-delivery-container',
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
    MatIconModule,
    MatGridListModule,
    TranslateModule,
    VehicleSpecsDisplayComponent,
    DocumentChecklistComponent,
    SignaturePadComponent,
    AttachmentUploaderComponent
  ],
  templateUrl: './retail-delivery-container.component.html',
  styleUrls: ['./retail-delivery-container.component.css']
})
export class RetailDeliveryContainerComponent implements OnInit {
  private retailService = inject(RetailService);
  private salesService = inject(SalesService);
  private inventoryService = inject(InventoryService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild(AttachmentUploaderComponent) attachmentUploader?: AttachmentUploaderComponent;

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  invoiceId: number | null = null;
  invoice = signal<SalesInvoice | null>(null);
  vehicleSpecs = signal<VehicleSpecs | null>(null);
  loading = signal(false);
  submitting = signal(false);

  gatePassSerial = '';
  deliveredToName = '';
  deliveredToNationalId = '';
  deliveredToPhone = '';
  driverName = '';
  notes = '';
  signatureData: string | null = null;
  checklistItems = DEFAULT_CHECKLIST;
  currentChecklist = signal<ChecklistItem[]>(DEFAULT_CHECKLIST);

  ngOnInit(): void {
    this.invoiceId = Number(this.route.snapshot.queryParamMap.get('invoiceId')) || null;
    this.gatePassSerial = `GP-${Date.now()}`;
    if (this.invoiceId) {
      this.loadInvoice(this.invoiceId);
    }
  }

  private loadInvoice(invoiceId: number): void {
    this.loading.set(true);
    this.salesService.getInvoiceById(invoiceId).subscribe({
      next: invoice => {
        this.invoice.set(invoice);
        this.deliveredToName = invoice.ownerCustomerName || invoice.customerName || '';
        this.loading.set(false);

        const firstCarId = invoice.items?.[0]?.carId;
        if (firstCarId) {
          const car = this.inventoryService.cars$().find((c: any) => c.id === firstCarId);
          if (car) {
            this.vehicleSpecs.set({
              vin: car.vin,
              plateNumber: car.plateNumber,
              make: car.make,
              model: car.model,
              year: car.year,
              exteriorColor: car.exteriorColor,
              engineSize: car.engineSize,
              transmission: car.transmission
            });
          }
        }
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.APPROVAL_LOAD_FAILED');
      }
    });
  }

  onChecklistChange(items: ChecklistItem[]): void {
    this.currentChecklist.set(items);
  }

  onSignatureChange(signature: string | null): void {
    this.signatureData = signature;
  }

  get isFormValid(): boolean {
    return !!this.invoiceId && !!this.gatePassSerial && !!this.deliveredToName && !!this.signatureData;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.invoiceId) {
      if (!this.signatureData) {
        this.notificationService.showError('BANK_FINANCING.SIGNATURE_REQUIRED');
      }
      return;
    }

    this.submitting.set(true);
    this.retailService
      .createDelivery({
        salesInvoiceId: this.invoiceId,
        gatePassSerial: this.gatePassSerial,
        deliveredToName: this.deliveredToName,
        deliveredToNationalId: this.deliveredToNationalId || undefined,
        deliveredToPhone: this.deliveredToPhone || undefined,
        driverName: this.driverName || undefined,
        signatureData: this.signatureData || undefined,
        checklistJson: JSON.stringify(this.currentChecklist()),
        notes: this.notes || undefined,
        userId: 1
      })
      .subscribe({
        next: delivery => {
          this.submitting.set(false);
          this.notificationService.showSuccess('CORPORATE.DELIVERY_COMPLETED');
          if (this.attachmentUploader) {
            this.attachmentUploader.uploadPending(delivery.id);
          }
          const isBankChannel = this.route.snapshot.data['channel'] === 'bank';
          this.router.navigate([isBankChannel ? '/sales/bank/deliveries/view' : '/sales/retail/deliveries/view', delivery.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.notificationService.showError('CORPORATE.DELIVERY_FAILED');
        }
      });
  }
}
