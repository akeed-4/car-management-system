import { ChangeDetectorRef, Component, OnInit, computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupplierLookupModalComponent } from '../../shared/supplier-lookup-modal/supplier-lookup-modal.component';
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
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { NotificationService } from '../../../services/notification.service';
import { CreatePurchaseRequestDto } from '../../../models/purchase-request.model';
import { PurchaseRequisitionDto } from '../../../models/purchase-requisition.model';
import { PurchaseRequisitionService } from '../../../services/purchase-requisition.service';
import { SupplierService } from '@/src/services/supplier.service';
import { Supplier } from '@/src/models/supplier.model';
import { InventoryService } from '../../../services/inventory.service';

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
    MatTooltipModule,
    DxDataGridModule,
    DxButtonModule,
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

  /** Purchase Requisitions eligible to originate a new RFQ -- the dropdown source. */
  eligibleOrders = signal<PurchaseRequisitionDto[]>([]);
  suppliers = signal<Supplier[]>([]);

  /** Backs the smart supplier selector's summary card, same pattern as payment-form's selectedSupplier. */
  selectedSupplierId = signal<number | null>(null);
  selectedSupplier = computed(() => this.suppliers().find(s => s.id === this.selectedSupplierId()) ?? null);

  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private purchaseRequisitionService: PurchaseRequisitionService,
    private supplierService: SupplierService,
    private inventoryService: InventoryService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.initForm();
  }

  /** Smart searchable supplier selector -- mirrors openSupplierLookup() in payment-form.component.ts. */
  openSupplierLookup(): void {
    const dialogRef = this.dialog.open<SupplierLookupModalComponent, unknown, Supplier | null>(SupplierLookupModalComponent, {
      width: '90vw',
      maxWidth: '900px',
      height: '80vh',
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(supplier => {
      if (supplier) {
        this.requestForm.get('supplierId')?.setValue(supplier.id);
        this.requestForm.get('supplierId')?.markAsTouched();
      }
    });
  }

  ngOnInit(): void {
    this.loadRequisitions();
    this.loadSuppliers();
    this.requestForm.get('supplierId')?.valueChanges.subscribe(id => this.selectedSupplierId.set(id ?? null));
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
      /** UI-only: picks a Requisition to pre-fill items from; not part of the saved request. */
      sourceRequisitionId: [null, Validators.required],
      supplierId: [null, Validators.required],
      notes: ['']
    });
  }

  loadRequisitions(): void {
    this.purchaseRequisitionService.getAll().subscribe({
      next: (requisitions: any) => this.eligibleOrders.set(requisitions.data || []),
      error: (err) => {
        console.error('Error loading purchase requisitions', err);
        this.eligibleOrders.set([]);
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (data: Supplier[]) => this.suppliers.set(data),
      error: err => console.error('Error loading suppliers', err)
    });
  }

  /** Cascading onChange: selecting a Purchase Order (Requisition) auto-fills cars. */
  onOrderSelected(orderId: number | null): void {
    this.requestItems = [];

    if (!orderId) return;

    this.purchaseRequisitionService.getById(orderId).subscribe({
      next: (response: any) => {
        const order = response?.data ?? response;
        const cars = this.inventoryService.cars$();

        this.requestItems = (order.items || []).map((item: any) => {
          const car = cars.find(c => c.id === Number(item.itemCode));
          return {
            carId: car?.id ?? Number(item.itemCode) ?? 0,
            carDescription: item.itemDescription,
            make: car?.make || '',
            model: car?.model || '',
            year: car?.year || new Date().getFullYear(),
            quantity: item.requestedQuantity,
            unitPrice: item.standardBasePrice,
            lineTotal: item.requestedQuantity * item.standardBasePrice
          };
        });
        this.updateDocumentPreview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase order lines', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.LOAD_ORDER_ERROR'));
      }
    });
  }

  removeItem(e: any): void {
    const carId = e.row?.data?.carId;
    this.requestItems = this.requestItems.filter(i => i.carId !== carId);
    this.updateDocumentPreview();
  }

  loadRequest(id: number): void {
    this.purchaseCycleService.getPurchaseRequest(id).subscribe({
      next: (request: any) => {
        request=request?.data ?? request;
        this.requestForm.patchValue({
          requestNumber: request.requestNumber,
          requestDate: request.requestDate,
          supplierId: request.supplierId,
          notes: request.notes
        }, { emitEvent: false });
        // The source-requisition picker is only meaningful when creating a new request, so it
        // has nothing to patch here -- disable its required validation in edit mode.
        this.requestForm.get('sourceRequisitionId')?.clearValidators();
        this.requestForm.get('sourceRequisitionId')?.updateValueAndValidity({ emitEvent: false });
        this.requestItems = (request.items || []).map((item: any) => ({
          carId: item.carId,
          carDescription: item.carDescription || item.car?.description || `${item.car?.make ?? ''} ${item.car?.model ?? ''} ${item.car?.year ?? ''}`.trim(),
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
      supplierId: this.requestForm.getRawValue().supplierId,
      notes: this.requestForm.value.notes,
      items: this.requestItems.map(item => ({
        carId: item.carId,
        carDescription: item.carDescription,
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
