import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { NotificationService } from '../../../services/notification.service';
import { PurchaseOfferDto } from '../../../models/purchase-offer.model';
import { CreatePurchaseRequestDto } from '../../../models/purchase-request.model';

interface RequestLineItem {
  carId: number;
  carDescription: string;
  make: string;
  model: string;
  year: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

@Component({
  selector: 'app-purchase-request-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './purchase-request-form.component.html',
  styleUrls: ['./purchase-request-form.component.css']
})
export class PurchaseRequestFormComponent implements OnInit {
  requestForm!: FormGroup;
  isEditMode = false;
  requestId: number | null = null;

  requestItems: RequestLineItem[] = [];
  documentDetails: RequestLineItem[] = [];
  grandTotal = 0;

  /** Accepted offers not yet converted into a request -- the only eligible dropdown source. */
  eligibleOffers = signal<PurchaseOfferDto[]>([]);
  selectedOffer: PurchaseOfferDto | null = null;

  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadEligibleOffers();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.requestId = +params['id'];
        this.loadRequest(this.requestId);
      }
    });
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      requestNumber: ['', Validators.required],
      requestDate: [new Date(), Validators.required],
      purchaseOfferId: [null, Validators.required],
      supplierId: [{ value: null, disabled: true }],
      notes: ['']
    });
  }

  loadEligibleOffers(): void {
    this.purchaseCycleService.getEligibleOffersForRequest().subscribe({
      next: (offers) => this.eligibleOffers.set(offers || []),
      error: (err) => {
        console.error('Error loading eligible offers', err);
        this.eligibleOffers.set([]);
      }
    });
  }

  /** Cascading onChange: selecting an Offer auto-fills supplier, items, quantities, prices, tax and terms. */
  onOfferSelected(offerId: number | null): void {
    this.requestItems = [];
    this.selectedOffer = null;
    this.requestForm.patchValue({ supplierId: null }, { emitEvent: false });

    if (!offerId) return;

    this.purchaseCycleService.getPurchaseOffer(offerId).subscribe({
      next: (offer) => {
        this.selectedOffer = offer;
        // Supplier is inherited from the offer and locked -- never editable once a parent doc is chosen.
        this.requestForm.patchValue({ supplierId: offer.supplierId }, { emitEvent: false });

        this.requestItems = (offer.items || []).map(item => ({
          carId: item.carId,
          carDescription: item.car?.description || `${item.car?.make ?? ''} ${item.car?.model ?? ''} ${item.car?.year ?? ''}`.trim(),
          make: item.car?.make || '',
          model: item.car?.model || '',
          year: item.car?.year || new Date().getFullYear(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }));
        this.updateDocumentPreview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading offer lines', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.LOAD_OFFER_ERROR'));
      }
    });
  }

  loadRequest(id: number): void {
    this.purchaseCycleService.getPurchaseRequest(id).subscribe({
      next: (request) => {
        this.requestForm.patchValue({
          requestNumber: request.requestNumber,
          requestDate: request.requestDate,
          purchaseOfferId: request.purchaseOfferId,
          supplierId: request.supplierId,
          notes: request.notes
        });
        this.requestItems = (request.items || []).map(item => ({
          carId: item.carId,
          carDescription: item.car?.description || `${item.car?.make ?? ''} ${item.car?.model ?? ''} ${item.car?.year ?? ''}`.trim(),
          make: item.car?.make || '',
          model: item.car?.model || '',
          year: item.car?.year || new Date().getFullYear(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }));
        this.updateDocumentPreview();
      },
      error: (err) => {
        console.error('Error loading purchase request', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.LOAD_ERROR'));
      }
    });
  }

  quantitySetCellValue = (newData: any, value: number, currentRowData: RequestLineItem): void => {
    newData.quantity = value;
    newData.lineTotal = value * currentRowData.unitPrice;
    setTimeout(() => this.updateDocumentPreview());
  };

  unitPriceSetCellValue = (newData: any, value: number, currentRowData: RequestLineItem): void => {
    newData.unitPrice = value;
    newData.lineTotal = currentRowData.quantity * value;
    setTimeout(() => this.updateDocumentPreview());
  };

  updateDocumentPreview(): void {
    this.documentDetails = [...this.requestItems];
    this.grandTotal = this.documentDetails.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
  }

  onSubmit(): void {
    if (this.requestForm.invalid || this.requestItems.length === 0) {
      this.requestForm.markAllAsTouched();
      if (this.requestItems.length === 0) {
        this.notificationService.showWarning(this.translateService.instant('PURCHASE_REQUESTS.NO_ITEMS_WARNING'));
      }
      return;
    }

    const dto: CreatePurchaseRequestDto = {
      requestNumber: this.requestForm.value.requestNumber,
      requestDate: this.requestForm.value.requestDate,
      purchaseOfferId: this.requestForm.value.purchaseOfferId,
      notes: this.requestForm.value.notes,
      items: this.requestItems.map(item => ({
        carId: item.carId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    const request = this.isEditMode && this.requestId
      ? this.purchaseCycleService.updatePurchaseRequest(this.requestId, dto)
      : this.purchaseCycleService.createPurchaseRequest(dto);

    request.subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUESTS.SAVE_SUCCESS'));
        this.router.navigate(['/purchases/requests']);
      },
      error: (err) => {
        console.error('Error saving purchase request', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.SAVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/purchases/requests']);
  }
}
