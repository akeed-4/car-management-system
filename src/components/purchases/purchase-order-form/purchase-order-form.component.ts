import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
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
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { SupplierService } from '../../../services/supplier.service';
import { NotificationService } from '../../../services/notification.service';
import { Supplier } from '../../../models/supplier.model';
import { ApprovedQuotationLookupDto, CreatePoDto } from '../../../models/purchase-order.model';

interface PoLineItem {
  supplierRfqItemId: number;
  itemDescription: string;
  remainingQuantity: number;
  quotedUnitPrice: number;
  orderedQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

@Component({
  selector: 'app-purchase-order-form',
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
    DxDataGridModule,
    DxButtonModule,
    TranslateModule
  ],
  templateUrl: './purchase-order-form.component.html',
  styleUrls: ['./purchase-order-form.component.css']
})
export class PurchaseOrderFormComponent implements OnInit {
  poForm!: FormGroup;
  isEditMode = false;
  poId: number | null = null;

  poItems: PoLineItem[] = [];
  documentDetails: PoLineItem[] = [];
  grandTotal = 0;

  suppliers = signal<Supplier[]>([]);
  /** Approved quotations with remaining lines, for the selected vendor. */
  eligibleQuotations = signal<ApprovedQuotationLookupDto[]>([]);

  constructor(
    private fb: FormBuilder,
    private purchaseOrderService: PurchaseOrderService,
    private supplierService: SupplierService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => this.suppliers.set(suppliers || []),
      error: (err) => console.error('Error loading suppliers', err)
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.poId = +params['id'];
        this.loadPo(this.poId);
      }
    });
  }

  initForm(): void {
    this.poForm = this.fb.group({
      poNumber: ['', Validators.required],
      poDate: [new Date(), Validators.required],
      vendorId: [null, Validators.required],
      supplierRfqId: [{ value: null, disabled: true }, Validators.required],
      expectedDeliveryDate: [null],
      notes: ['']
    });
  }

  /** Cascading onChange: selecting a vendor loads its approved, not-yet-fully-ordered quotations. */
  onVendorSelected(vendorId: number | null): void {
    this.poItems = [];
    this.eligibleQuotations.set([]);
    this.poForm.patchValue({ supplierRfqId: null }, { emitEvent: false });
    this.updateDocumentPreview();

    const rfqControl = this.poForm.get('supplierRfqId');
    if (!vendorId) {
      rfqControl?.disable();
      return;
    }
    rfqControl?.enable();

    this.purchaseOrderService.getQuotationsByVendor(vendorId).subscribe({
      next: (quotations) => this.eligibleQuotations.set(quotations || []),
      error: (err) => {
        console.error('Error loading approved quotations', err);
        this.eligibleQuotations.set([]);
      }
    });
  }

  /** Cascading onChange: selecting a Supplier RFQ auto-fills the PO grid with its remaining lines and negotiated prices. */
  onQuotationSelected(supplierRfqId: number | null): void {
    this.poItems = [];
    this.updateDocumentPreview();
    if (!supplierRfqId) return;

    this.purchaseOrderService.getItemsForPO(supplierRfqId).subscribe({
      next: (items) => {
        this.poItems = (items || []).map(item => ({
          supplierRfqItemId: item.supplierRfqItemId,
          itemDescription: item.itemDescription,
          remainingQuantity: item.remainingQuantity,
          quotedUnitPrice: item.quotedUnitPrice,
          orderedQuantity: item.remainingQuantity,
          unitPrice: item.quotedUnitPrice,
          lineTotal: item.remainingQuantity * item.quotedUnitPrice
        }));
        this.updateDocumentPreview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading quotation lines', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_ORDER.LOAD_QUOTATION_ERROR'));
      }
    });
  }

  quantitySetCellValue = (newData: any, value: number, currentRowData: PoLineItem): void => {
    newData.orderedQuantity = value;
    newData.lineTotal = value * currentRowData.unitPrice;
    setTimeout(() => this.updateDocumentPreview());
  };

  unitPriceSetCellValue = (newData: any, value: number, currentRowData: PoLineItem): void => {
    newData.unitPrice = value;
    newData.lineTotal = currentRowData.orderedQuantity * value;
    setTimeout(() => this.updateDocumentPreview());
  };

  updateDocumentPreview(): void {
    this.documentDetails = [...this.poItems];
    this.grandTotal = this.documentDetails.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
  }

  loadPo(id: number): void {
    this.purchaseOrderService.getById(id).subscribe({
      next: (po) => {
        this.poForm.patchValue({
          poNumber: po.poNumber,
          poDate: po.poDate,
          vendorId: po.vendorId,
          supplierRfqId: po.supplierRfqId,
          expectedDeliveryDate: po.expectedDeliveryDate,
          notes: po.notes
        });
        this.poForm.get('supplierRfqId')?.enable();
        this.poItems = (po.items || []).map(item => ({
          supplierRfqItemId: item.supplierRfqItemId ?? 0,
          itemDescription: item.itemDescription,
          remainingQuantity: item.remainingQuantity,
          quotedUnitPrice: item.unitPrice,
          orderedQuantity: item.orderedQuantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }));
        this.updateDocumentPreview();

        if (po.status !== 'Open') {
          this.poForm.disable();
        }
      },
      error: (err) => {
        console.error('Error loading PO', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_ORDER.LOAD_ERROR'));
      }
    });
  }

  onSubmit(): void {
    if (this.poForm.invalid || this.poItems.length === 0) {
      this.poForm.markAllAsTouched();
      if (this.poItems.length === 0) {
        this.notificationService.showWarning(this.translateService.instant('PURCHASE_ORDER.NO_ITEMS_WARNING'));
      }
      return;
    }

    const raw = this.poForm.getRawValue();
    const dto: CreatePoDto = {
      poNumber: raw.poNumber,
      poDate: raw.poDate,
      vendorId: raw.vendorId,
      supplierRfqId: raw.supplierRfqId,
      expectedDeliveryDate: raw.expectedDeliveryDate,
      notes: raw.notes,
      items: this.poItems.map(item => ({
        supplierRfqItemId: item.supplierRfqItemId,
        orderedQuantity: item.orderedQuantity,
        unitPrice: item.unitPrice
      }))
    };

    const onSuccess = () => {
      this.notificationService.showSuccess(this.translateService.instant('PURCHASE_ORDER.SAVE_SUCCESS'));
      this.router.navigate(['/purchases/orders']);
    };
    const onError = (err: any) => {
      console.error('Error saving PO', err);
      this.notificationService.showError(this.translateService.instant('PURCHASE_ORDER.SAVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
    };

    if (this.isEditMode && this.poId) {
      this.purchaseOrderService.update(this.poId, {
        expectedDeliveryDate: dto.expectedDeliveryDate,
        notes: dto.notes
      }).subscribe({ next: onSuccess, error: onError });
    } else {
      this.purchaseOrderService.create(dto).subscribe({ next: onSuccess, error: onError });
    }
  }

  onCancel(): void {
    this.router.navigate(['/purchases/orders']);
  }
}
