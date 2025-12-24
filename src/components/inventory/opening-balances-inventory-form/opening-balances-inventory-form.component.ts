import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AccountingService } from '../../accounting/accounting.service';
import { CarSelectionDialogComponent } from '../../purchases/purchase-invoice/car-selection-dialog/car-selection-dialog.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-opening-balances-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    CarSelectionDialogComponent,
  ],
  templateUrl: './opening-balances-inventory-form.component.html',
  styleUrls: ['./opening-balances-inventory-form.component.css']
})
export class OpeningBalancesInventoryFormComponent implements OnInit {

  form: FormGroup;
  isEditing = false;
  editingId: number | null = null;

  categories = ['CAR', 'SPARE_PART', 'ACCESSORY'];
  locations = ['SHOWROOM_A', 'SHOWROOM_B', 'WAREHOUSE'];

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      itemId: ['', Validators.required],
      itemName: ['', Validators.required],
      category: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      totalCost: [{ value: 0, disabled: true }],
      location: ['', Validators.required],
      notes: [''],
      entryDate: [new Date(), Validators.required]
    });

    // Calculate total cost when quantity or unit cost changes
    this.form.get('quantity')?.valueChanges.subscribe(() => this.calculateTotalCost());
    this.form.get('unitCost')?.valueChanges.subscribe(() => this.calculateTotalCost());
  }

  ngOnInit() {
    // Check if editing (for future edit route)
  }

  calculateTotalCost() {
    const quantity = this.form.get('quantity')?.value || 0;
    const unitCost = this.form.get('unitCost')?.value || 0;
    const totalCost = quantity * unitCost;
    this.form.get('totalCost')?.setValue(totalCost);
  }

  onSave() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const balanceData = {
        itemId: formValue.itemId,
        itemName: formValue.itemName,
        category: formValue.category,
        quantity: formValue.quantity,
        unitCost: formValue.unitCost,
        totalCost: formValue.quantity * formValue.unitCost,
        location: formValue.location,
        notes: formValue.notes,
        entryDate: formValue.entryDate
      };

      this.accountingService.createOpeningBalanceInventory(balanceData).subscribe({
        next: (newBalance) => {
          this.router.navigate(['/inventory/opening-balances']);
        },
        error: (error) => {
          console.error('Error creating opening balance:', error);
        }
      });
    }
  }

  openCarSelectionDialog() {
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.form.patchValue({
          itemId: result.id,
          itemName: result.carName || `${result.make} ${result.model}`
        });
      }
    });
  }

  onCancel() {
    this.router.navigate(['/inventory/opening-balances']);
  }
}