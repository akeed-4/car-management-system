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
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { InventoryService } from '../../../../services/inventory.service';
import { PurchaseCycleService } from '../../../../services/purchase-cycle.service';
import { CarSelectionDialogComponent } from '../../purchase-invoice/car-selection-dialog/car-selection-dialog.component';

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
  suppliers: any[] = [];
  receiptItems: any[] = [];
  documentDetails: any[] = [];
  grandTotal = 0;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private purchaseCycleService: PurchaseCycleService,
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
    this.receiptForm.valueChanges.subscribe(() => this.updateDocumentPreview());
  }

  initForm(): void {
    this.receiptForm = this.fb.group({
      receiptNumber: ['', Validators.required],
      supplierId: [null, Validators.required],
      receiptDate: [new Date(), Validators.required],
      notes: ['']
    });
  }

  openCarSelector(): void {
    const ref = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {}
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.addCarToReceipt(result);
    });
  }

  addCarToReceipt(car: any): void {
    if (!car) return;
    const item = {
      carId: car.id,
      carDescription: car.description || `${car.make} ${car.model} ${car.year}`,
      make: car.make,
      model: car.model,
      year: car.year,
      quantity: 1,
      unitPrice: car.purchasePrice ?? car.salePrice ?? 0,
      lineTotal: car.purchasePrice ?? car.salePrice ?? 0
    };
    this.receiptItems = [...this.receiptItems, item];
    this.updateDocumentPreview();
        this.cdr.detectChanges();
  }

  removeItem(e: any): void {
    const id = e.row?.data?.carId;
    this.receiptItems = this.receiptItems.filter(i => i.carId !== id);
    this.updateDocumentPreview();
  }

  updateDocumentPreview(): void {
    this.documentDetails = this.receiptItems.length ? [...this.receiptItems] : [];
    this.grandTotal = this.documentDetails.reduce((s, it) => s + (it.lineTotal || 0), 0);
  }

  onSubmit(): void {
    if (this.receiptForm.invalid) return;
    const payload = {
      ...this.receiptForm.value,
      items: this.receiptItems
    };
    this.purchaseCycleService.createPurchaseOffer(payload as any).subscribe({
      next: () => this.router.navigate(['/purchases/car-receipts']),
      error: err => console.error('Error saving receipt', err)
    });
  }

  onCancel(): void { this.router.navigate(['/purchases/car-receipts']); }
}
