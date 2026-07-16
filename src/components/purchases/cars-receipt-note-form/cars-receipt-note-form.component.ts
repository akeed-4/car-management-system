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
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CarsReceiptNoteService } from '../../../services/cars-receipt-note.service';
import { NotificationService } from '../../../services/notification.service';
import { ActivePOLookupDto, CarsReceiptNoteDto, CreateCarsReceiptNoteDto } from '../../../models/cars-receipt-note.model';
import { CarSelectionDialogComponent } from '../purchase-invoice/car-selection-dialog/car-selection-dialog.component';
import { DocumentHeaderComponent } from '../../shared/document-header/document-header.component';
import { DocumentActionsToolbarComponent } from '../../shared/document-actions-toolbar/document-actions-toolbar.component';
import { ApprovalActionDialogComponent, ApprovalActionDialogResult } from '../../shared/approval-action-dialog/approval-action-dialog.component';
import { DocumentAuditTrailViewerComponent } from '../../shared/document-audit-trail-viewer/document-audit-trail-viewer.component';
import { DocumentLifecycleAction } from '../../../models/document-lifecycle.model';

interface GrnLineItem {
  purchaseOrderItemId: number;
  itemDescription: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  remainingQuantity: number;
  receivedQuantity: number;
  notes?: string;
  carId?: number; // Required to submit -- picked per line via pickCar()
  carDescription?: string;
}

@Component({
  selector: 'app-cars-receipt-note-form',
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
    TranslateModule,
    DocumentHeaderComponent,
    DocumentActionsToolbarComponent
  ],
  templateUrl: './cars-receipt-note-form.component.html',
  styleUrls: ['./cars-receipt-note-form.component.css']
})
export class CarsReceiptNoteFormComponent implements OnInit {
  grnForm!: FormGroup;
  isViewMode = false;
  grnId: number | null = null;

  lineItems: GrnLineItem[] = [];
  documentDetails: GrnLineItem[] = [];

  /** Open or PartiallyReceived POs -- the only eligible dropdown source. */
  activePOs = signal<ActivePOLookupDto[]>([]);

  /** Set once an existing GRN is loaded -- drives the document header + actions toolbar. */
  loadedGrn: CarsReceiptNoteDto | null = null;

  constructor(
    private fb: FormBuilder,
    private carsReceiptNoteService: CarsReceiptNoteService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.grnId = +params['id'];
        this.isViewMode = true;
        this.loadGrn(this.grnId);
      } else {
        this.loadActivePOs();
      }
    });
  }

  initForm(): void {
    this.grnForm = this.fb.group({
      receiptDate: [new Date(), Validators.required],
      purchaseOrderId: [null, Validators.required],
      notes: ['']
    });
  }

  loadActivePOs(): void {
    this.carsReceiptNoteService.getActivePOs().subscribe({
      next: (pos: any) => this.activePOs.set(pos.data || []),
      error: (err) => {
        console.error('Error loading active purchase orders', err);
        this.activePOs.set([]);
      }
    });
  }

  /** Cascading onChange: selecting a PO auto-fills the GRN grid with its remaining lines. */
  onPoSelected(purchaseOrderId: number | null): void {
    this.lineItems = [];
    this.updateDocumentPreview();
    if (!purchaseOrderId) return;

    this.carsReceiptNoteService.getRemainingPOLines(purchaseOrderId).subscribe({
      next: (response: any) => {
        const lines = response?.data ?? [];
        this.lineItems = lines.map((line: any) => {
          const orderedQuantity = line.orderedQuantity ?? 0;
          const previouslyReceivedQuantity = line.previouslyReceivedQuantity ?? 0;
          const remainingQuantity = line.remainingQuantity ?? 0;
          return {
            purchaseOrderItemId: line.purchaseOrderItemId,
            itemId: line.id,
            itemDescription: line.itemDescription,
            orderedQuantity,
            previouslyReceivedQuantity,
            remainingQuantity,
            receivedQuantity: remainingQuantity, // Default to the remaining quantity
            unitPrice: line.unitPrice,
            notes: line.notes ?? ''
          };
        });

        this.updateDocumentPreview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading PO lines', err);
        this.notificationService.showError(this.translateService.instant('CARS_RECEIPT_NOTE.LOAD_PO_ERROR'));
      }
    });
  }

  receivedQuantitySetCellValue = (newData: any, value: number, currentRowData: GrnLineItem): void => {
    if (value > currentRowData.remainingQuantity) {
      this.notificationService.showWarning(this.translateService.instant('CARS_RECEIPT_NOTE.MAX_QTY_WARNING'));
      return;
    }
    newData.receivedQuantity = value;
    setTimeout(() => this.updateDocumentPreview());
  };

  updateDocumentPreview(): void {
    this.documentDetails = [...this.lineItems];
  }

  /** Opens the car picker for a single GRN line -- required before the line can be submitted. */
  pickCar(e: any): void {
    const rowData: GrnLineItem = e.row?.data ?? e;
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {}
    });

    dialogRef.afterClosed().subscribe(car => {
      if (!car) return;

      const index = this.lineItems.findIndex(i => i.purchaseOrderItemId === rowData.purchaseOrderItemId);
      if (index === -1) return;

      this.lineItems[index] = {
        ...this.lineItems[index],
        carId: car.id,
        carDescription: `${car.make} ${car.model} (${car.year})`
      };
      this.lineItems = [...this.lineItems];
      this.updateDocumentPreview();
      this.cdr.detectChanges();
    });
  }

  carDisplay = (rowData: GrnLineItem): string => {
    return rowData.carDescription || this.translateService.instant('CARS_RECEIPT_NOTE.SELECT_CAR');
  };

  loadGrn(id: number): void {
    this.carsReceiptNoteService.getById(id).subscribe({
      next: (grn) => {
        this.loadedGrn = grn;
        this.grnForm.patchValue({
          receiptDate: grn.receiptDate,
          purchaseOrderId: grn.purchaseOrderId,
          notes: grn.notes
        });
        this.grnForm.disable();
        this.lineItems = (grn.items || []).map(item => ({
          carId: item.carId,
          carDescription: item.carDescription,
          purchaseOrderItemId: item.purchaseOrderItemId,
          itemDescription: item.itemDescription,
          orderedQuantity: item.orderedQuantity,
          previouslyReceivedQuantity: item.previouslyReceivedQuantity,
          remainingQuantity: 0,
          receivedQuantity: item.receivedQuantity,
          notes: item.notes
        }));
        this.updateDocumentPreview();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading car receipt note', err);
        this.notificationService.showError(this.translateService.instant('CARS_RECEIPT_NOTE.LOAD_ERROR'));
      }
    });
  }

  openAuditTrail(): void {
    if (!this.grnId) return;
    this.dialog.open(DocumentAuditTrailViewerComponent, {
      width: '600px',
      data: { entityName: 'CarsReceiptNote', entityId: this.grnId }
    });
  }

  onLifecycleAction(action: DocumentLifecycleAction): void {
    if (!this.grnId || !this.loadedGrn) return;

    const requireReason = action === 'reject' || action === 'cancel';
    const dialogRef = this.dialog.open(ApprovalActionDialogComponent, {
      width: '480px',
      data: { action, documentNumber: this.loadedGrn.documentNumber, requireReason }
    });

    dialogRef.afterClosed().subscribe((result?: ApprovalActionDialogResult) => {
      if (!result?.confirmed) return;
      this.runLifecycleAction(action, result.reason);
    });
  }

  private runLifecycleAction(action: DocumentLifecycleAction, reason?: string): void {
    const id = this.grnId!;
    const call$ =
      action === 'approve' ? this.carsReceiptNoteService.approve(id) :
      action === 'reopen' ? this.carsReceiptNoteService.reopen(id) :
      action === 'reject' ? this.carsReceiptNoteService.reject(id, { reason: reason! }) :
      this.carsReceiptNoteService.cancel(id, { reason: reason! });

    call$.subscribe({
      next: (grn) => {
        this.loadedGrn = grn;
        this.notificationService.showSuccess(this.translateService.instant('DOCUMENT_LIFECYCLE.ACTION_SUCCESS'));
        this.loadGrn(id);
      },
      error: (err) => {
        console.error(`Error performing ${action} on GRN`, err);
        this.notificationService.showError(this.translateService.instant('DOCUMENT_LIFECYCLE.ACTION_ERROR'));
      }
    });
  }

  onSubmit(): void {
    if (this.grnForm.invalid || this.lineItems.length === 0) {
      this.grnForm.markAllAsTouched();
      if (this.lineItems.length === 0) {
        this.notificationService.showWarning(this.translateService.instant('CARS_RECEIPT_NOTE.NO_ITEMS'));
      }
      return;
    }

    const linesToReceive = this.lineItems.filter(i => i.receivedQuantity > 0);
    if (linesToReceive.length === 0) {
      this.notificationService.showWarning(this.translateService.instant('CARS_RECEIPT_NOTE.NOTHING_TO_RECEIVE'));
      return;
    }

    const missingCar = linesToReceive.find(i => !i.carId);
    if (missingCar) {
      this.notificationService.showWarning(this.translateService.instant('CARS_RECEIPT_NOTE.CAR_REQUIRED_WARNING'));
      return;
    }

    const raw = this.grnForm.getRawValue();
    const selectedPo = this.activePOs().find(po => po.id === raw.purchaseOrderId);
    if (!selectedPo) {
      this.notificationService.showError(this.translateService.instant('CARS_RECEIPT_NOTE.LOAD_PO_ERROR'));
      return;
    }
    const dto: CreateCarsReceiptNoteDto = {
      receiptDate: raw.receiptDate,
      purchaseOrderId: raw.purchaseOrderId,
      notes: raw.notes,
      supplierId: selectedPo.vendorId,
      items: linesToReceive.map(item => ({
        carId: item.carId!,
        carDescription: item.carDescription!,
        purchaseOrderItemId: item.purchaseOrderItemId,
        receivedQuantity: item.receivedQuantity,
        notes: item.notes,
    
      }))
    };

    this.carsReceiptNoteService.create(dto).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('CARS_RECEIPT_NOTE.SAVE_SUCCESS'));
        this.router.navigate(['/purchases/receipt-notes']);
      },
      error: (err) => {
        console.error('Error saving car receipt note', err);
        this.notificationService.showError(this.translateService.instant('CARS_RECEIPT_NOTE.SAVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/purchases/receipt-notes']);
  }
}
