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
import { MatCardModule } from '@angular/material/card';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseRequisitionService } from '../../../services/purchase-requisition.service';
import { NotificationService } from '../../../services/notification.service';
import { CreatePurchaseRequisitionDto } from '../../../models/purchase-requisition.model';

interface RequisitionLineItem {
  itemCode?: string;
  itemDescription: string;
  unitOfMeasure: string;
  requestedQuantity: number;
  standardBasePrice: number;
  lineTotal: number;
  notes?: string;
}

@Component({
  selector: 'app-purchase-requisition-form',
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
  templateUrl: './purchase-requisition-form.component.html',
  styleUrls: ['./purchase-requisition-form.component.css']
})
export class PurchaseRequisitionFormComponent implements OnInit {
  requisitionForm!: FormGroup;
  isEditMode = false;
  requisitionId: number | null = null;
  currentStatus: string | null = null;

  lineItems: RequisitionLineItem[] = [];
  documentDetails: RequisitionLineItem[] = [];
  grandTotal = 0;

  constructor(
    private fb: FormBuilder,
    private purchaseRequisitionService: PurchaseRequisitionService,
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
        this.isEditMode = true;
        this.requisitionId = +params['id'];
        this.loadRequisition(this.requisitionId);
      }
    });
  }

  initForm(): void {
    this.requisitionForm = this.fb.group({
      requisitionNumber: ['', Validators.required],
      requisitionDate: [new Date(), Validators.required],
      departmentName: [''],
      notes: ['']
    });
  }

  addLine(): void {
    this.lineItems.push({
      itemCode: '',
      itemDescription: '',
      unitOfMeasure: 'EA',
      requestedQuantity: 1,
      standardBasePrice: 0,
      lineTotal: 0,
      notes: ''
    });
    this.updateDocumentPreview();
    this.cdr.detectChanges();
  }

  removeLine(rowIndex: number): void {
    this.lineItems.splice(rowIndex, 1);
    this.updateDocumentPreview();
  }

  onRemoveClick = (e: any): void => {
    const rowIndex = e.row.rowIndex;
    this.removeLine(rowIndex);
  };

  quantitySetCellValue = (newData: any, value: number, currentRowData: RequisitionLineItem): void => {
    newData.requestedQuantity = value;
    newData.lineTotal = value * currentRowData.standardBasePrice;
    setTimeout(() => this.updateDocumentPreview());
  };

  basePriceSetCellValue = (newData: any, value: number, currentRowData: RequisitionLineItem): void => {
    newData.standardBasePrice = value;
    newData.lineTotal = currentRowData.requestedQuantity * value;
    setTimeout(() => this.updateDocumentPreview());
  };

  updateDocumentPreview(): void {
    this.documentDetails = [...this.lineItems];
    this.grandTotal = this.documentDetails.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
  }

  loadRequisition(id: number): void {
    this.purchaseRequisitionService.getById(id).subscribe({
      next: (requisition) => {
        this.currentStatus = requisition.status;
        this.requisitionForm.patchValue({
          requisitionNumber: requisition.requisitionNumber,
          requisitionDate: requisition.requisitionDate,
          departmentName: requisition.departmentName,
          notes: requisition.notes
        });
        this.lineItems = (requisition.items || []).map(item => ({
          itemCode: item.itemCode,
          itemDescription: item.itemDescription,
          unitOfMeasure: item.unitOfMeasure,
          requestedQuantity: item.requestedQuantity,
          standardBasePrice: item.standardBasePrice,
          lineTotal: item.requestedQuantity * item.standardBasePrice,
          notes: item.notes
        }));
        this.updateDocumentPreview();

        if (requisition.status !== 'Draft') {
          this.requisitionForm.disable();
        }
      },
      error: (err) => {
        console.error('Error loading purchase requisition', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.LOAD_ERROR'));
      }
    });
  }

  onSubmit(): void {
    if (this.requisitionForm.invalid || this.lineItems.length === 0) {
      this.requisitionForm.markAllAsTouched();
      if (this.lineItems.length === 0) {
        this.notificationService.showWarning(this.translateService.instant('PURCHASE_REQUISITION.NO_ITEMS_WARNING'));
      }
      return;
    }

    const raw = this.requisitionForm.getRawValue();
    const dto: CreatePurchaseRequisitionDto = {
      requisitionNumber: raw.requisitionNumber,
      requisitionDate: raw.requisitionDate,
      departmentName: raw.departmentName,
      notes: raw.notes,
      items: this.lineItems.map(item => ({
        itemCode: item.itemCode,
        itemDescription: item.itemDescription,
        unitOfMeasure: item.unitOfMeasure,
        requestedQuantity: item.requestedQuantity,
        standardBasePrice: item.standardBasePrice,
        notes: item.notes
      }))
    };

    const onSuccess = () => {
      this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUISITION.SAVE_SUCCESS'));
      this.router.navigate(['/purchases/requisitions']);
    };
    const onError = (err: any) => {
      console.error('Error saving purchase requisition', err);
      this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.SAVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
    };

    if (this.isEditMode && this.requisitionId) {
      this.purchaseRequisitionService.update(this.requisitionId, {
        requisitionNumber: dto.requisitionNumber,
        requisitionDate: dto.requisitionDate,
        departmentName: dto.departmentName,
        notes: dto.notes
      }).subscribe({ next: onSuccess, error: onError });
    } else {
      this.purchaseRequisitionService.create(dto).subscribe({ next: onSuccess, error: onError });
    }
  }

  onCancel(): void {
    this.router.navigate(['/purchases/requisitions']);
  }
}
