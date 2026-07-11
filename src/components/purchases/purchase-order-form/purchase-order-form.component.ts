import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { PurchaseCycleRefreshService } from '../../../services/purchase-cycle-refresh.service';
import { SupplierService } from '../../../services/supplier.service';
import { NotificationService } from '../../../services/notification.service';
import { Supplier } from '../../../models/supplier.model';
import { CreatePoDto } from '../../../models/purchase-order.model';
import { ApprovedOfferLookupDto } from '../../../models/purchase-offer.model';

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
export class PurchaseOrderFormComponent implements OnInit, OnDestroy {
  poForm!: FormGroup;
  isEditMode = false;
  poId: number | null = null;

  poItems: PoLineItem[] = [];
  documentDetails: PoLineItem[] = [];
  grandTotal = 0;

  suppliers = signal<Supplier[]>([]);
  /** Approved purchase offers with remaining lines, for the selected vendor. */
  eligibleQuotations = signal<ApprovedOfferLookupDto[]>([]);
  /** Details of the selected vendor -- wrapped in an array for the details grid. */
  supplierDetails: Supplier[] = [];

  private offersChangedSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private purchaseOrderService: PurchaseOrderService,
    private purchaseCycleService: PurchaseCycleService,
    private purchaseCycleRefreshService: PurchaseCycleRefreshService,
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
      next: (suppliers) => {
        this.suppliers.set(suppliers || []);
        const vendorId = this.poForm.get('vendorId')?.value;
        if (vendorId) {
          this.setSupplierDetails(vendorId);
        }
      },
      error: (err) => console.error('Error loading suppliers', err)
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.poId = +params['id'];
        this.loadPo(this.poId);
      }
    });

    // Approving/rejecting/converting a purchase offer elsewhere invalidates the current
    // eligible-offers dropdown -- re-fetch it for whichever vendor is currently selected.
    this.offersChangedSubscription = this.purchaseCycleRefreshService.offersChanged$.subscribe(() => {
      const vendorId = this.poForm.get('vendorId')?.value;
      if (vendorId) {
        this.loadEligibleOffers(vendorId);
      }
    });
  }

  ngOnDestroy(): void {
    this.offersChangedSubscription?.unsubscribe();
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

  /** Looks up the full supplier record from the loaded list and exposes it to the details grid. */
  setSupplierDetails(vendorId: number | null): void {
    const supplier = vendorId ? this.suppliers().find(s => s.id === vendorId) ?? null : null;
    this.supplierDetails = supplier ? [supplier] : [];
  }

  /** Cascading onChange: selecting a vendor loads its details and its approved, not-yet-fully-ordered quotations. */
  onVendorSelected(vendorId: number | null): void {
    this.poItems = [];
    this.eligibleQuotations.set([]);
    this.poForm.patchValue({ supplierRfqId: null }, { emitEvent: false });
    this.updateDocumentPreview();
    this.setSupplierDetails(vendorId);

    const rfqControl = this.poForm.get('supplierRfqId');
    if (!vendorId) {
      rfqControl?.disable();
      return;
    }
    rfqControl?.enable();

    this.loadEligibleOffers(vendorId);
  }

  /** Fetches approved, not-yet-fully-ordered offers for the given vendor into the quotation dropdown. */
  private loadEligibleOffers(vendorId: number): void {
    this.purchaseCycleService.getEligibleOffersForPO(vendorId).subscribe({
      next: (offers: any) => {
        debugger
        this.eligibleQuotations.set(offers || []);
      },
      error: (err) => {
        console.error('Error loading purchase offers', err);
        this.eligibleQuotations.set([]);
      }
    });
  }

  /** Cascading onChange: selecting a purchase offer auto-fills the PO grid with its remaining lines. */
  onQuotationSelected(offerId: number | null): void {
    this.poItems = [];
    this.updateDocumentPreview();
    if (!offerId) return;

    this.purchaseCycleService.getItemsForOffer(offerId).subscribe({
      next: (response: any) => {
        const offerItems = response ?? [];
debugger
        this.poItems = offerItems.map((item: any) => {
          const remainingQuantity = item.remainingQuantity ?? 0;
          const unitPrice = item.unitPrice ?? 0;

          return {
            supplierRfqItemId: item.purchaseOfferItemId,
            itemId: item.itemId,
            itemDescription: item.itemDescription,
            remainingQuantity,
            quotedUnitPrice: unitPrice,
            orderedQuantity: remainingQuantity,
            unitPrice,
            lineTotal: remainingQuantity * unitPrice
          };
        });

        this.updateDocumentPreview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase offer lines', err);
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
          supplierRfqId: po.supplierRfqId ?? po.purchaseOfferId,
          expectedDeliveryDate: po.expectedDeliveryDate,
          notes: po.notes
        });
        this.poForm.get('supplierRfqId')?.enable();
        this.setSupplierDetails(po.vendorId);
        this.poItems = (po.items || []).map(item => ({
          supplierRfqItemId: item.supplierRfqItemId ?? item.purchaseOfferItemId ?? 0,
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
      purchaseOfferId: raw.supplierRfqId,
      expectedDeliveryDate: raw.expectedDeliveryDate,
      notes: raw.notes,
      items: this.poItems.map(item => ({
        purchaseOfferItemId: item.supplierRfqItemId,
        orderedQuantity: item.orderedQuantity,
        unitPrice: item.unitPrice
      }))
    };

    const onSuccess = () => {
      this.notificationService.showSuccess(this.translateService.instant('PURCHASE_ORDER.SAVE_SUCCESS'));
      this.purchaseCycleRefreshService.notifyPoListChanged();
      if (!this.isEditMode) {
        // Creating a PO from an offer consumes some of its remaining quantity.
        this.purchaseCycleRefreshService.notifyOffersChanged();
      }
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
