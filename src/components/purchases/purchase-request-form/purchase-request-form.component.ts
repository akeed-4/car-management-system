import { ChangeDetectorRef, Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
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
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { NotificationService } from '../../../services/notification.service';
import { CreatePurchaseRequestDto } from '../../../models/purchase-request.model';
import { SupplierService } from '@/src/services/supplier.service';
import { Supplier } from '@/src/models/supplier.model';
import { CarSelectionDialogComponent } from '../purchase-invoice/car-selection-dialog/car-selection-dialog.component';

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
    DxButtonModule,
    TranslateModule,
    NgxMatSelectSearchModule
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

  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private supplierService: SupplierService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadSuppliers();
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
      supplierId: [null, Validators.required],
      notes: ['']
    });
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
      next: (data: Supplier[]) => this.suppliers.set(data),
      error: err => console.error('Error loading suppliers', err)
    });
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
    const unitPrice = car.purchasePrice ?? car.salePrice ?? 0;
    const lineTotal = quantity * unitPrice;
    const newItem: RequestLineItem = {
      carId: car.id,
      carDescription: car.description || `${car.make} ${car.model} ${car.year}`,
      make: car.make || '',
      model: car.model || '',
      year: car.year || new Date().getFullYear(),
      quantity,
      unitPrice,
      lineTotal
    };
    this.requestItems = [...this.requestItems, newItem];
    this.updateDocumentPreview();
    this.cdr.detectChanges();
  }

  removeItem(e: any): void {
    const carId = e.row?.data?.carId;
    this.requestItems = this.requestItems.filter(i => i.carId !== carId);
    this.updateDocumentPreview();
  }

  loadRequest(id: number): void {
    this.purchaseCycleService.getPurchaseRequest(id).subscribe({
      next: (request) => {
        this.requestForm.patchValue({
          requestNumber: request.requestNumber,
          requestDate: request.requestDate,
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
      supplierId: this.requestForm.value.supplierId,
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
