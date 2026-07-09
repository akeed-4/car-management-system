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
import { CarsReceiptNoteService } from '../../../services/cars-receipt-note.service';
import { NotificationService } from '../../../services/notification.service';
import { ActivePOLookupDto, CreateCarsReceiptNoteDto } from '../../../models/cars-receipt-note.model';

interface GrnLineItem {
  purchaseOrderItemId: number;
  itemDescription: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  remainingQuantity: number;
  receivedQuantity: number;
  notes?: string;
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
    TranslateModule
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

  constructor(
    private fb: FormBuilder,
    private carsReceiptNoteService: CarsReceiptNoteService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
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
      grnNumber: ['', Validators.required],
      receiptDate: [new Date(), Validators.required],
      purchaseOrderId: [null, Validators.required],
      notes: ['']
    });
  }

  loadActivePOs(): void {
    this.carsReceiptNoteService.getActivePOs().subscribe({
      next: (pos) => this.activePOs.set(pos || []),
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
      next: (lines) => {
        this.lineItems = (lines || []).map(line => ({
          purchaseOrderItemId: line.purchaseOrderItemId,
          itemDescription: line.itemDescription,
          orderedQuantity: line.orderedQuantity,
          previouslyReceivedQuantity: line.previouslyReceivedQuantity,
          remainingQuantity: line.remainingQuantity,
          receivedQuantity: line.remainingQuantity,
          notes: ''
        }));
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

  loadGrn(id: number): void {
    this.carsReceiptNoteService.getById(id).subscribe({
      next: (grn) => {
        this.grnForm.patchValue({
          grnNumber: grn.grnNumber,
          receiptDate: grn.receiptDate,
          purchaseOrderId: grn.purchaseOrderId,
          notes: grn.notes
        });
        this.grnForm.disable();
        this.lineItems = (grn.items || []).map(item => ({
          purchaseOrderItemId: item.purchaseOrderItemId,
          itemDescription: item.itemDescription,
          orderedQuantity: item.orderedQuantity,
          previouslyReceivedQuantity: item.previouslyReceivedQuantity,
          remainingQuantity: 0,
          receivedQuantity: item.receivedQuantity,
          notes: item.notes
        }));
        this.updateDocumentPreview();
      },
      error: (err) => {
        console.error('Error loading car receipt note', err);
        this.notificationService.showError(this.translateService.instant('CARS_RECEIPT_NOTE.LOAD_ERROR'));
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

    const raw = this.grnForm.getRawValue();
    const dto: CreateCarsReceiptNoteDto = {
      grnNumber: raw.grnNumber,
      receiptDate: raw.receiptDate,
      purchaseOrderId: raw.purchaseOrderId,
      notes: raw.notes,
      items: linesToReceive.map(item => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        receivedQuantity: item.receivedQuantity,
        notes: item.notes
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
