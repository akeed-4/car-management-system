import { ChangeDetectorRef, Component, OnInit, signal, ViewChild } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridModule, DxButtonModule, DxSelectBoxModule, DxPopupModule, DxDataGridComponent } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CreatePurchaseOfferDto } from '../../../models/purchase-offer.model';
import { PurchaseRequestDto } from '../../../models/purchase-request.model';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { MatCardModule } from '@angular/material/card';
import { NotificationService } from '@/src/services/notification.service';
import { Car } from '../../../models/car.model';
import { buildVehicleDescription } from '../../../models/vehicle-description';
import { CarSelectionDialogComponent } from '../purchase-invoice/car-selection-dialog/car-selection-dialog.component';

@Component({
  selector: 'app-purchase-offer-form',
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
    DxDataGridModule,
    DxPopupModule,
    DxButtonModule,
    DxSelectBoxModule,
    TranslateModule,
    MatCardModule
  ],
  templateUrl: './purchase-offer-form.component.html',
  styleUrls: ['./purchase-offer-form.component.css']
})
export class PurchaseOfferFormComponent implements OnInit {
  offerForm!: FormGroup;
  isEditMode = false;
  offerId?: number;
  offerItems: any[] = [];
  documentDetails: any[] = [];
  selectedCars: Car[] = [];
  grandTotal = 0;

  /** Purchase Requests (Supplier Price Requests) -- the only eligible dropdown source. */
  eligibleRequests = signal<PurchaseRequestDto[]>([]);
  selectedRequest: PurchaseRequestDto | null = null;

  @ViewChild(DxDataGridComponent)
  grid!: DxDataGridComponent;

  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private dialog: MatDialog

  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadEligibleRequests();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.offerId = +params['id'];
        this.loadOffer(this.offerId);
      }
    });
    this.offerForm.valueChanges.subscribe(() => this.updateDocumentPreview());
  }


  initForm(): void {
    this.offerForm = this.fb.group({
      offerNumber: ['', Validators.required],
      purchaseRequestId: [null, Validators.required],
      supplierId: [{ value: null, disabled: true }],
      offerDate: [new Date(), Validators.required],
      paymentTerms: [''],
      deliveryTerms: [''],
      taxRate: [0],
      notes: ['']
    });
  }

  loadEligibleRequests(): void {
    this.purchaseCycleService.getPurchaseRequests().subscribe({
      next: (requests:any) => this.eligibleRequests.set(requests.data || []),
      error: (err) => {
        console.error('Error loading purchase requests', err);
        this.eligibleRequests.set([]);
      }
    });
  }

  /** Cascading onChange: selecting a Supplier Price Request auto-fills supplier and items. */
  onRequestSelected(requestId: number | null): void {
    this.offerItems = [];
    this.selectedCars = [];
    this.selectedRequest = null;
    this.offerForm.patchValue({ supplierId: null }, { emitEvent: false });

    if (!requestId) return;

    this.purchaseCycleService.getPurchaseRequest(requestId).subscribe({
      next: (request) => {
        this.selectedRequest = request;
        this.offerForm.patchValue({ supplierId: request.supplierId }, { emitEvent: false });

        this.offerItems = (request.items || []).map(item => ({
          carId: item.carId,
          carDescription: item.car?.description || buildVehicleDescription(item.car),
          make: item.car?.make || '',
          model: item.car?.model || '',
          year: item.car?.year || new Date().getFullYear(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }));
        this.selectedCars = (request.items || []).map(item => item.car).filter((c): c is Car => !!c);
        this.updateDocumentPreview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase request lines', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_OFFER.LOAD_REQUEST_ERROR'));
      }
    });
  }

  loadOffer(id: number): void {
    this.purchaseCycleService.getPurchaseOffer(id).subscribe(offer => {
      this.offerForm.patchValue({
        offerNumber: offer.offerNumber,
        purchaseRequestId: offer.purchaseRequestId,
        supplierId: offer.supplierId,
        offerDate: offer.offerDate,
        paymentTerms: offer.paymentTerms,
        deliveryTerms: offer.deliveryTerms,
        taxRate: offer.taxRate ?? 0,
        notes: offer.notes
      });
      this.offerItems = offer.items.map(item => ({
        carId: item.carId,
        carDescription: item.car?.description || `${item.car?.make ?? ''} ${item.car?.model ?? ''} ${item.car?.year ?? ''}`.trim(),
        make: item.car?.make || '',
        model: item.car?.model || '',
        year: item.car?.year || new Date().getFullYear(),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal
      }));
      this.selectedCars = offer.items.map(item => item.car).filter((c): c is Car => !!c);
      this.updateDocumentPreview();
    });
  }

  toggleCarCards(): void {
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {},
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectCar(result);
      }
    });
  }

  selectCar(car: Car): void {
    if (!car || this.offerItems.some(i => i.carId === car.id)) return;

    const quantity = 1;
    const unitPrice = car.purchasePrice ?? car.salePrice ?? 0;
    this.offerItems = [...this.offerItems, {
      carId: car.id,
      carDescription: car.description || buildVehicleDescription(car),
      make: car.make || '',
      model: car.model || '',
      year: car.year || new Date().getFullYear(),
      quantity,
      unitPrice,
      lineTotal: quantity * unitPrice
    }];
    this.selectedCars = [...this.selectedCars, car];
    this.updateDocumentPreview();
    this.cdr.detectChanges();
  }

onSubmit(): void {
  if (this.offerForm.invalid || this.offerItems.length === 0) {
    this.offerForm.markAllAsTouched();
    return;
  }

  // Save any cell currently being edited
  this.grid.instance.saveEditData();

  const dto: CreatePurchaseOfferDto = {
    offerNumber: this.offerForm.value.offerNumber,
    offerDate: this.offerForm.value.offerDate,
    supplierId: this.offerForm.getRawValue().supplierId,
    purchaseRequestId: this.offerForm.value.purchaseRequestId,
    paymentTerms: this.offerForm.value.paymentTerms,
    deliveryTerms: this.offerForm.value.deliveryTerms,
    taxRate: this.offerForm.value.taxRate,
    notes: this.offerForm.value.notes,
    items: this.offerItems.map(item => ({
      carId: item.carId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  };

  const request = this.isEditMode
    ? this.purchaseCycleService.updatePurchaseOffer(this.offerId!, dto)
    : this.purchaseCycleService.createPurchaseOffer(dto);

  request.subscribe({
    next: () => this.notificationService.showSuccess('PURCHASE_OFFER.SAVE_SUCCESS'),
    error: err => this.notificationService.showError(this.translateService.instant('PURCHASE_OFFER.SAVE_ERROR_DETAIL', { error: err?.message || 'Unknown error' }))
  });
}
  onCancel(): void {
    this.router.navigate(['/purchases/offers']);
  }

  removeItem(e: any): void {
    const carId = e.row?.data?.carId;
    this.offerItems = this.offerItems.filter(i => i.carId !== carId);
    this.selectedCars = this.selectedCars.filter(c => c.id !== carId);
    this.updateDocumentPreview();
  }

  updateDocumentPreview(): void {
    this.documentDetails = [...this.offerItems];
    this.grandTotal = this.documentDetails.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
  }
  unitPrice = (newData: any, value: number, currentRowData: any) => {
    newData.unitPrice = value;
    newData.lineTotal = value * currentRowData.quantity;

    setTimeout(() => {
      this.updateDocumentPreview();
    });
  };

  quantity = (newData: any, value: number, currentRowData: any) => {
    newData.quantity = value;
    newData.lineTotal = value * currentRowData.unitPrice;

    setTimeout(() => {
      this.updateDocumentPreview();
    });
  };

  onCellValueChanged(e: any) {
    if (e.data) {
      e.data.lineTotal = e.data.quantity * e.data.unitPrice;
    }

    this.grandTotal = this.offerItems.reduce(
      (sum, x) => sum + x.lineTotal,
      0
    );

    this.updateDocumentPreview();
  }
}
