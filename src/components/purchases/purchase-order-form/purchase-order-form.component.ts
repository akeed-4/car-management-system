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
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { NotificationService } from '../../../services/notification.service';
import { PurchaseRequestDto } from '../../../models/purchase-request.model';
import { CreatePoDto } from '../../../models/purchase-order.model';

interface PoLineItem {
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

  /** Approved Purchase Requests not yet converted into a PO -- the only eligible dropdown source. */
  eligibleRequests = signal<PurchaseRequestDto[]>([]);
  selectedRequest: PurchaseRequestDto | null = null;

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
    this.loadEligibleRequests();
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
      purchaseRequestId: [null, Validators.required],
      supplierId: [{ value: null, disabled: true }],
      notes: ['']
    });
  }

  loadEligibleRequests(): void {
    this.purchaseCycleService.getEligibleRequestsForPo().subscribe({
      next: (requests) => this.eligibleRequests.set(requests || []),
      error: (err) => {
        console.error('Error loading eligible purchase requests', err);
        this.eligibleRequests.set([]);
      }
    });
  }

  /** Cascading onChange: selecting a Purchase Request auto-fills supplier (locked) and all approved quantities/prices. */
  onRequestSelected(requestId: number | null): void {
    this.poItems = [];
    this.selectedRequest = null;
    this.poForm.patchValue({ supplierId: null }, { emitEvent: false });

    if (!requestId) return;

    this.purchaseCycleService.getPurchaseRequest(requestId).subscribe({
      next: (request) => {
        this.selectedRequest = request;
        this.poForm.patchValue({ supplierId: request.supplierId }, { emitEvent: false });

        this.poItems = (request.items || []).map(item => ({
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
        console.error('Error loading purchase request lines', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_ORDER.LOAD_REQUEST_ERROR'));
      }
    });
  }

  quantitySetCellValue = (newData: any, value: number, currentRowData: PoLineItem): void => {
    newData.quantity = value;
    newData.lineTotal = value * currentRowData.unitPrice;
    setTimeout(() => this.updateDocumentPreview());
  };

  unitPriceSetCellValue = (newData: any, value: number, currentRowData: PoLineItem): void => {
    newData.unitPrice = value;
    newData.lineTotal = currentRowData.quantity * value;
    setTimeout(() => this.updateDocumentPreview());
  };

  updateDocumentPreview(): void {
    this.documentDetails = [...this.poItems];
    this.grandTotal = this.documentDetails.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
  }

  loadPo(id: number): void {
    this.purchaseCycleService.getPurchaseOrder(id).subscribe({
      next: (po) => {
        this.poForm.patchValue({
          poNumber: po.poNumber,
          poDate: po.poDate,
          purchaseRequestId: po.purchaseRequestId,
          supplierId: po.supplierId,
          notes: po.notes
        });
        this.poItems = (po.items || []).map(item => ({
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

    const dto: CreatePoDto = {
      poNumber: this.poForm.value.poNumber,
      poDate: this.poForm.value.poDate,
      purchaseRequestId: this.poForm.value.purchaseRequestId,
      notes: this.poForm.value.notes,
      items: this.poItems.map(item => ({
        carId: item.carId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    const request = this.isEditMode && this.poId
      ? this.purchaseCycleService.updatePurchaseOrder(this.poId, dto)
      : this.purchaseCycleService.createPurchaseOrder(dto);

    request.subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_ORDER.SAVE_SUCCESS'));
        this.router.navigate(['/purchases/orders']);
      },
      error: (err) => {
        console.error('Error saving PO', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_ORDER.SAVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/purchases/orders']);
  }
}
