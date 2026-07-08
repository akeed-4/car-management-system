import { ChangeDetectorRef, Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { DxDataGridModule, DxButtonModule, DxSelectBoxModule, DxPopupModule, DxDataGridComponent } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CreatePurchaseOfferDto } from '../../../models/purchase-offer.model';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { InventoryService } from '../../../services/inventory.service';
import { MatCardModule } from '@angular/material/card';
import { CarSelectionDialogComponent } from '../purchase-invoice/car-selection-dialog/car-selection-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SupplierService } from '@/src/services/supplier.service';
import { Supplier } from '@/src/models/supplier.model';
import { NotificationService } from '@/src/services/notification.service';

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
    MatCardModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './purchase-offer-form.component.html',
  styleUrls: ['./purchase-offer-form.component.css']
})
export class PurchaseOfferFormComponent implements OnInit {
  offerForm!: FormGroup;
  isEditMode = false;
  offerId?: number;
  cars: any[] = [];
  carPopupVisible = false;
  offerItems: any[] = [];
  documentDetails: any[] = [];
  grandTotal = 0;
@ViewChild(DxDataGridComponent)
grid!: DxDataGridComponent;
  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private inventoryService: InventoryService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
    private supplierService: SupplierService,
    private notificationService: NotificationService,
    private translateService: TranslateService

  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.offerId = +params['id'];
        this.loadOffer(this.offerId);
      }
    });
    this.offerForm.valueChanges.subscribe(() => this.updateDocumentPreview());
    this.loadSuppliers();
  }


  initForm(): void {
    this.offerForm = this.fb.group({
      offerNumber: ['', Validators.required],
      supplierId: [null, Validators.required],
      offerDate: [new Date(), Validators.required],
      paymentTerms: [''],
      deliveryTerms: [''],
      taxRate: [0],
      notes: ['']
    });
  }

  loadOffer(id: number): void {
    this.purchaseCycleService.getPurchaseOffer(id).subscribe(offer => {
      this.offerForm.patchValue({
        offerNumber: offer.offerNumber,
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
      this.updateDocumentPreview();
    });
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
    supplierId: this.offerForm.value.supplierId,
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
    next: () => this.notificationService.showSuccess('Purchase offer saved successfully'),
    error: err => this.notificationService.showError('Error saving purchase offer: ' + (err?.message || 'Unknown error'))
  });
}
  onCancel(): void {
    this.router.navigate(['/purchases/offers']);
  }

  openCarSelector(): void {
    this.inventoryService.getCars().subscribe({
      next: cars => this.cars = cars,
      error: err => console.error('Error loading cars', err)
    });
  }

  onCarRowClick(e: any): void {
    const car = e.data;
    this.selectCar(car);
  }
  toggleCarCards(): void {
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectCar(result);
      }
    });
  }

  selectCar(car: any): void {
    if (!car) return;
    const quantity = 1;
    const unitPrice = car.salePrice ?? car.purchasePrice ?? 0;
    const lineTotal = quantity * unitPrice;
    const newItem = {
      carId: car.id,
      carDescription: car.description || `${car.make} ${car.model} ${car.year}`,
      make: car.make || '',
      model: car.model || '',
      year: car.year || new Date().getFullYear(),
      quantity,
      unitPrice,
      lineTotal
    };
    this.offerItems = [...this.offerItems, newItem];

    this.updateDocumentPreview();
    this.cdr.detectChanges();
  }

  removeItem(e: any): void {
    const carId = e.row?.data?.carId;
    this.offerItems = this.offerItems.filter(i => i.carId !== carId);
    this.updateDocumentPreview();
  }

  supplierFilterCtrl = new FormControl('');

  suppliers = signal<Supplier[]>([]);

  supplierFilterSignal = toSignal(
    this.supplierFilterCtrl.valueChanges,
    { initialValue: '' }
  );

  filteredSuppliers = computed(() => {
    const filter = (this.supplierFilterSignal() ?? '').toLowerCase().trim();

    if (!filter) {
      return this.suppliers();
    }

    return this.suppliers().filter(s =>
      s.name.toLowerCase().includes(filter)
    );
  });
  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (data: Supplier[]) => {
        console.log(data);      // Check if data arrives
        this.suppliers.set(data);
      },
      error: err => console.error(err)
    });
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