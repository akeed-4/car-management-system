import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { PurchaseCycleService } from '../../../../services/purchase-cycle.service';
import { NotificationService } from '../../../../services/notification.service';
import { PoDto } from '../../../../models/purchase-order.model';
import { CarReceipt, CarReceiptUnit, CreateCarReceiptDto } from '../../../../models/car-receipt.model';
import { VinManagementDialogComponent, VinEntry } from '../../vin-management-dialog/vin-management-dialog.component';

interface ReceiptLineItem {
  carId: number;
  carDescription: string;
  make: string;
  model: string;
  year: number;
  orderedQty: number;
  alreadyReceivedQty: number;
  remainingQty: number;
  receivedQty: number;
  unitPrice: number;
  lineTotal: number;
  units: CarReceiptUnit[];
}

@Component({
  selector: 'app-car-receipts-form',
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
    DxButtonModule,
    TranslateModule,
    MatCardModule
  ],
  templateUrl: './car-receipts-form.component.html',
  styleUrls: ['./car-receipts-form.component.css']
})
export class CarReceiptsFormComponent implements OnInit {
  receiptForm!: FormGroup;

  /** Open or PartiallyReceived POs -- the only eligible dropdown source. Fully-received POs never appear. */
  openPurchaseOrders: PoDto[] = [];
  selectedPo: PoDto | null = null;
  private existingReceipts: CarReceipt[] = [];

  receiptItems: ReceiptLineItem[] = [];
  documentDetails: ReceiptLineItem[] = [];
  grandTotal = 0;
  isEditMode = false;
  receiptId?: number;

  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        // load existing receipt if editing
      }
    });
    this.loadOpenPurchaseOrders();
    this.loadExistingReceipts();
  }

  initForm(): void {
    this.receiptForm = this.fb.group({
      receiptNumber: ['', Validators.required],
      purchaseOrderId: [null, Validators.required],
      supplierId: [{ value: null, disabled: true }],
      receiptDate: [new Date(), Validators.required],
      notes: ['']
    });
  }

  loadOpenPurchaseOrders(): void {
    this.purchaseCycleService.getOpenPurchaseOrders().subscribe({
      next: (orders: any) => {
        this.openPurchaseOrders = Array.isArray(orders) ? orders : (orders?.data ?? []);
      },
      error: (err) => console.error('Error loading purchase orders', err)
    });
  }

  loadExistingReceipts(): void {
    this.purchaseCycleService.getCarReceipts().subscribe({
      next: (receipts) => this.existingReceipts = receipts,
      error: (err) => console.error('Error loading car receipts', err)
    });
  }

  /** Cascading onChange: selecting a PO auto-fills supplier (locked) and remaining quantities per car. */
  onPoSelected(poId: number | null): void {
    this.selectedPo = null;
    this.receiptItems = [];
    this.receiptForm.patchValue({ supplierId: null }, { emitEvent: false });
    this.updateDocumentPreview();

    if (!poId) return;

    this.purchaseCycleService.getPurchaseOrder(poId).subscribe({
      next: (po) => {
        this.selectedPo = po;
        this.receiptForm.patchValue({ supplierId: po.supplierId }, { emitEvent: false });
        this.buildItemsFromPo(po);
      },
      error: (err) => {
        console.error('Error loading purchase order', err);
        this.notificationService.showError(this.translateService.instant('CAR_RECEIPTS.LOAD_PO_ERROR'));
      }
    });
  }

  private buildItemsFromPo(po: PoDto): void {
    const receivedMap = this.computeReceivedQtyMap(po.id);
    this.receiptItems = (po.items || []).map(item => {
      const alreadyReceived = receivedMap.get(item.carId) ?? 0;
      const remaining = Math.max(0, item.quantity - alreadyReceived);
      return {
        carId: item.carId,
        carDescription: item.car?.description || `${item.car?.make ?? ''} ${item.car?.model ?? ''} ${item.car?.year ?? ''}`.trim(),
        make: item.car?.make || '',
        model: item.car?.model || '',
        year: item.car?.year || new Date().getFullYear(),
        orderedQty: item.quantity,
        alreadyReceivedQty: alreadyReceived,
        remainingQty: remaining,
        receivedQty: remaining,
        unitPrice: item.unitPrice,
        lineTotal: remaining * item.unitPrice,
        units: []
      };
    });
    this.updateDocumentPreview();
    this.cdr.detectChanges();
  }

  private computeReceivedQtyMap(poId: number): Map<number, number> {
    const map = new Map<number, number>();
    this.existingReceipts
      .filter(r => r.purchaseOrderId === poId && (!this.isEditMode || r.id !== this.receiptId))
      .forEach(r => {
        (r.carReceiptItems || []).forEach(ci => {
          map.set(ci.carId, (map.get(ci.carId) ?? 0) + (ci.receivedQuantity || 0));
        });
      });
    return map;
  }

  receivedQtySetCellValue = (newData: any, value: number, currentRowData: ReceiptLineItem) => {
    let clamped = Math.max(0, value ?? 0);
    if (clamped > currentRowData.remainingQty) {
      clamped = currentRowData.remainingQty;
      this.notificationService.showWarning(this.translateService.instant('CAR_RECEIPTS.MAX_QTY_WARNING'));
    }
    newData.receivedQty = clamped;
    newData.lineTotal = clamped * currentRowData.unitPrice;
    // Quantity changed -- any previously captured VINs no longer match, so clear them.
    newData.units = [];
    setTimeout(() => this.updateDocumentPreview());
  };

  unitPriceSetCellValue = (newData: any, value: number, currentRowData: ReceiptLineItem) => {
    newData.unitPrice = value;
    newData.lineTotal = currentRowData.receivedQty * value;
    setTimeout(() => this.updateDocumentPreview());
  };

  /** Opens the VIN/color capture dialog for a receipt line -- required before the line can be saved. */
  captureVins(e: any): void {
    const item: ReceiptLineItem = e.row?.data ?? e;
    if (!item || item.receivedQty <= 0) return;

    const dialogRef = this.dialog.open(VinManagementDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {
        item: { carDescription: item.carDescription, carId: item.carId },
        requiredQuantity: item.receivedQty,
        existingVins: (item.units || []).map(u => ({ vin: u.vin, color: u.color, engineNumber: u.engineNumber } as VinEntry))
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.vins) {
        const index = this.receiptItems.findIndex(i => i.carId === item.carId);
        if (index !== -1) {
          this.receiptItems[index] = {
            ...this.receiptItems[index],
            units: (result.vins as VinEntry[]).map(v => ({ vin: v.vin, color: v.color, engineNumber: v.engineNumber }))
          };
          this.receiptItems = [...this.receiptItems];
          this.cdr.detectChanges();
        }
      }
    });
  }

  vinsCaptured = (rowData: ReceiptLineItem): string => {
    const captured = rowData.units?.length ?? 0;
    return `${captured} / ${rowData.receivedQty}`;
  };

  updateDocumentPreview(): void {
    this.documentDetails = this.receiptItems.length ? [...this.receiptItems] : [];
    this.grandTotal = this.documentDetails.reduce((s, it) => s + (it.lineTotal || 0), 0);
  }

  onSubmit(): void {
    if (this.receiptForm.invalid) {
      this.receiptForm.markAllAsTouched();
      return;
    }

    const linesToReceive = this.receiptItems.filter(i => i.receivedQty > 0);
    if (linesToReceive.length === 0) {
      this.notificationService.showWarning(this.translateService.instant('CAR_RECEIPTS.NOTHING_TO_RECEIVE'));
      return;
    }

    const incompleteVins = linesToReceive.find(i => (i.units?.length ?? 0) !== i.receivedQty);
    if (incompleteVins) {
      this.notificationService.showWarning(this.translateService.instant('CAR_RECEIPTS.VIN_REQUIRED_WARNING'));
      return;
    }

    const payload: CreateCarReceiptDto = {
      receiptNumber: this.receiptForm.value.receiptNumber,
      purchaseOrderId: this.receiptForm.value.purchaseOrderId,
      receiptDate: this.receiptForm.value.receiptDate,
      notes: this.receiptForm.value.notes,
      carReceiptItems: linesToReceive.map(item => ({
        carId: item.carId,
        receivedQuantity: item.receivedQty,
        unitCost: item.unitPrice,
        units: item.units
      }))
    };

    this.purchaseCycleService.createCarReceipt(payload).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('CAR_RECEIPTS.SAVE_SUCCESS'));
        this.router.navigate(['/purchases/receipts']);
      },
      error: err => {
        console.error('Error saving receipt', err);
        this.notificationService.showError(this.translateService.instant('CAR_RECEIPTS.SAVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onCancel(): void { this.router.navigate(['/purchases/receipts']); }
}
