import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { DxDataGridModule, DxButtonModule, DxSelectBoxModule, DxPopupModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { PurchaseOffer } from '../../../models/purchase-offer.model';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { InventoryService } from '../../../services/inventory.service';
import { Supplier } from '../../../models/purchase-offer.model';
import { MatCardModule } from '@angular/material/card';
import { CarSelectionDialogComponent } from '../purchase-invoice/car-selection-dialog/car-selection-dialog.component';
import { MatDialog } from '@angular/material/dialog';

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
  suppliers: Supplier[] = [];
  cars: any[] = [];
  carPopupVisible = false;
  offerItems: any[] = [];
  documentDetails: any[] = [];
  grandTotal = 0;

  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private inventoryService: InventoryService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router
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
  }

  initForm(): void {
    this.offerForm = this.fb.group({
      offerNumber: ['', Validators.required],
      supplierId: [null, Validators.required],
      offerDate: [new Date(), Validators.required],
      carDescription: ['', Validators.required],
      make: ['', Validators.required],
      model: ['', Validators.required],
      year: [new Date().getFullYear(), Validators.required],
      offeredPrice: [0, [Validators.required, Validators.min(0)]],
      status: ['Pending', Validators.required],
      notes: ['']
    });
  }

  loadOffer(id: number): void {
    this.purchaseCycleService.getPurchaseOffer(id).subscribe(offer => {
      this.offerForm.patchValue(offer);
      this.updateDocumentPreview();
    });
  }

  onSubmit(): void {
    if (this.offerForm.valid) {
      const offerData = this.offerForm.value;
      const operation = this.isEditMode 
        ? this.purchaseCycleService.updatePurchaseOffer(this.offerId!, offerData)
        : this.purchaseCycleService.createPurchaseOffer(offerData);

      operation.subscribe(() => {
        this.router.navigate(['/purchases/offers']);
      });
    }
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

    // Also patch basic form fields from the first selected car
    if (this.offerItems.length === 1) {
      this.offerForm.patchValue({
        make: car.make || '',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        carDescription: car.description || '',
        offeredPrice: unitPrice
      });
    }

    this.updateDocumentPreview();
    this.cdr.detectChanges();
  }

  removeItem(e: any): void {
    const carId = e.row?.data?.carId;
    this.offerItems = this.offerItems.filter(i => i.carId !== carId);
    this.updateDocumentPreview();
  }

  getSupplierName(id: any): string {
    return this.suppliers.find(s => s.id === id)?.name || '—';
  }

  updateDocumentPreview(): void {
    const v = this.offerForm.value;
    this.documentDetails = this.offerItems.length
      ? [...this.offerItems]
      : [{
          carDescription: v.carDescription,
          make: v.make,
          model: v.model,
          year: v.year,
          quantity: 1,
          unitPrice: v.offeredPrice,
          lineTotal: v.offeredPrice
        }];
    this.grandTotal = this.documentDetails.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
  }

}
