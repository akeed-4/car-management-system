import { ChangeDetectorRef, Component, OnInit, computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SupplierLookupModalComponent } from '../../shared/supplier-lookup-modal/supplier-lookup-modal.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SupplierRfqService } from '../../../services/supplier-rfq.service';
import { SupplierService } from '../../../services/supplier.service';
import { NotificationService } from '../../../services/notification.service';
import { Supplier } from '../../../models/supplier.model';
import { PendingRequisitionLookupDto, CreateSupplierRfqDto } from '../../../models/supplier-rfq.model';

interface RfqLineItem {
  purchaseRequisitionItemId: number;
  itemCode?: string;
  itemDescription: string;
  unitOfMeasure: string;
  remainingQuantity: number;
  standardBasePrice: number;
  quotedQuantity: number;
  quotedUnitPrice: number;
  lineTotal: number;
}

@Component({
  selector: 'app-supplier-rfq-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    DxDataGridModule,
    DxButtonModule,
    TranslateModule
  ],
  templateUrl: './supplier-rfq-form.component.html',
  styleUrls: ['./supplier-rfq-form.component.css']
})
export class SupplierRfqFormComponent implements OnInit {
  rfqForm!: FormGroup;
  isEditMode = false;
  rfqId: number | null = null;

  lineItems: RfqLineItem[] = [];
  documentDetails: RfqLineItem[] = [];
  grandTotal = 0;
  existingDocNumber: string | null = null;

  suppliers = signal<Supplier[]>([]);
  /** Pending Purchase Requisitions eligible for quoting by the selected vendor. */
  eligibleRequisitions = signal<PendingRequisitionLookupDto[]>([]);

  /** Backs the smart vendor selector's summary card, same pattern as payment-form's selectedSupplier. */
  selectedVendorId = signal<number | null>(null);
  selectedVendor = computed(() => this.suppliers().find(s => s.id === this.selectedVendorId()) ?? null);

  constructor(
    private fb: FormBuilder,
    private supplierRfqService: SupplierRfqService,
    private supplierService: SupplierService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.initForm();
  }

  /** Smart searchable vendor selector -- mirrors openSupplierLookup() in payment-form.component.ts. */
  openVendorLookup(): void {
    const dialogRef = this.dialog.open<SupplierLookupModalComponent, unknown, Supplier | null>(SupplierLookupModalComponent, {
      width: '90vw',
      maxWidth: '900px',
      height: '80vh',
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(supplier => {
      if (supplier) {
        this.rfqForm.get('vendorId')?.setValue(supplier.id);
        this.rfqForm.get('vendorId')?.markAsTouched();
        this.onVendorSelected(supplier.id);
      }
    });
  }

  ngOnInit(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => this.suppliers.set(suppliers || []),
      error: (err) => console.error('Error loading suppliers', err)
    });

    this.rfqForm.get('vendorId')?.valueChanges.subscribe(id => this.selectedVendorId.set(id ?? null));

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.rfqId = +params['id'];
        this.loadRfq(this.rfqId);
      }
    });
  }

  initForm(): void {
    this.rfqForm = this.fb.group({
      quotationDate: [new Date(), Validators.required],
      vendorId: [null, Validators.required],
      purchaseRequisitionId: [{ value: null, disabled: true }, Validators.required],
      validUntil: [null],
      notes: ['']
    });
  }

  /** Cascading onChange: selecting a vendor loads its eligible pending requisitions. */
  onVendorSelected(vendorId: number | null): void {
    this.lineItems = [];
    this.eligibleRequisitions.set([]);
    this.rfqForm.patchValue({ purchaseRequisitionId: null }, { emitEvent: false });
    this.updateDocumentPreview();

    const prControl = this.rfqForm.get('purchaseRequisitionId');
    if (!vendorId) {
      prControl?.disable();
      return;
    }
    prControl?.enable();

    this.supplierRfqService.getPendingRequisitionsByVendor(vendorId).subscribe({
      next: (requisitions) => this.eligibleRequisitions.set(requisitions || []),
      error: (err) => {
        console.error('Error loading pending requisitions', err);
        this.eligibleRequisitions.set([]);
      }
    });
  }

  /** Cascading onChange: selecting a Purchase Requisition auto-fills the quotation grid. */
  onRequisitionSelected(purchaseRequisitionId: number | null): void {
    this.lineItems = [];
    this.updateDocumentPreview();
    if (!purchaseRequisitionId) return;

    this.supplierRfqService.getItemsForQuote(purchaseRequisitionId).subscribe({
      next: (items) => {
        this.lineItems = (items || []).map(item => ({
          purchaseRequisitionItemId: item.purchaseRequisitionItemId,
          itemCode: item.itemCode,
          itemDescription: item.itemDescription,
          unitOfMeasure: item.unitOfMeasure,
          remainingQuantity: item.remainingQuantity,
          standardBasePrice: item.standardBasePrice,
          quotedQuantity: item.remainingQuantity,
          quotedUnitPrice: item.standardBasePrice,
          lineTotal: item.remainingQuantity * item.standardBasePrice
        }));
        this.updateDocumentPreview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading requisition lines', err);
        this.notificationService.showError(this.translateService.instant('SUPPLIER_RFQ.LOAD_REQUISITION_ERROR'));
      }
    });
  }

  quotedQuantitySetCellValue = (newData: any, value: number, currentRowData: RfqLineItem): void => {
    newData.quotedQuantity = value;
    newData.lineTotal = value * currentRowData.quotedUnitPrice;
    setTimeout(() => this.updateDocumentPreview());
  };

  quotedUnitPriceSetCellValue = (newData: any, value: number, currentRowData: RfqLineItem): void => {
    newData.quotedUnitPrice = value;
    newData.lineTotal = currentRowData.quotedQuantity * value;
    setTimeout(() => this.updateDocumentPreview());
  };

  updateDocumentPreview(): void {
    this.documentDetails = [...this.lineItems];
    this.grandTotal = this.documentDetails.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
  }

  loadRfq(id: number): void {
    this.supplierRfqService.getById(id).subscribe({
      next: (rfq) => {
        this.existingDocNumber = rfq.quotationNumber;
        this.rfqForm.patchValue({
          quotationDate: rfq.quotationDate,
          vendorId: rfq.vendorId,
          purchaseRequisitionId: rfq.purchaseRequisitionId,
          validUntil: rfq.validUntil,
          notes: rfq.notes
        });
        this.rfqForm.get('purchaseRequisitionId')?.enable();
        this.lineItems = (rfq.items || []).map(item => ({
          purchaseRequisitionItemId: item.purchaseRequisitionItemId,
          itemDescription: item.itemDescription,
          unitOfMeasure: '',
          remainingQuantity: item.quotedQuantity,
          standardBasePrice: item.standardBasePrice,
          quotedQuantity: item.quotedQuantity,
          quotedUnitPrice: item.quotedUnitPrice,
          lineTotal: item.lineTotal
        }));
        this.updateDocumentPreview();
      },
      error: (err) => {
        console.error('Error loading supplier quotation', err);
        this.notificationService.showError(this.translateService.instant('SUPPLIER_RFQ.LOAD_ERROR'));
      }
    });
  }

  onSubmit(): void {
    if (this.rfqForm.invalid || this.lineItems.length === 0) {
      this.rfqForm.markAllAsTouched();
      if (this.lineItems.length === 0) {
        this.notificationService.showWarning(this.translateService.instant('SUPPLIER_RFQ.NO_ITEMS_WARNING'));
      }
      return;
    }

    const raw = this.rfqForm.getRawValue();
    const dto: CreateSupplierRfqDto = {
      quotationNumber: this.existingDocNumber || '',
      quotationDate: raw.quotationDate,
      vendorId: raw.vendorId,
      purchaseRequisitionId: raw.purchaseRequisitionId,
      validUntil: raw.validUntil,
      notes: raw.notes,
      items: this.lineItems.map(item => ({
        purchaseRequisitionItemId: item.purchaseRequisitionItemId,
        quotedQuantity: item.quotedQuantity,
        quotedUnitPrice: item.quotedUnitPrice
      }))
    };

    const onSuccess = () => {
      this.notificationService.showSuccess(this.translateService.instant('SUPPLIER_RFQ.SAVE_SUCCESS'));
      this.router.navigate(['/purchases/supplier-quotations']);
    };
    const onError = (err: any) => {
      console.error('Error saving supplier quotation', err);
      this.notificationService.showError(this.translateService.instant('SUPPLIER_RFQ.SAVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
    };

    if (this.isEditMode && this.rfqId) {
      this.supplierRfqService.update(this.rfqId, { notes: dto.notes, items: dto.items })
        .subscribe({ next: onSuccess, error: onError });
    } else {
      this.supplierRfqService.create(dto)
        .subscribe({ next: onSuccess, error: onError });
    }
  }

  onCancel(): void {
    this.router.navigate(['/purchases/supplier-quotations']);
  }
}
