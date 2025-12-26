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
import { ActivatedRoute } from '@angular/router';
import { AccountingService } from '../../accounting/accounting.service';
import { StoreService } from '../../../services/store.service';
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
  // locations will be provided by StoreService
  stores$ = this.storeService.stores$;

  // Template-friendly getter to access current stores array
  get stores() {
    return this.storeService.stores$();
  }

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private storeService: StoreService
  ) {
    this.form = this.fb.group({
      itemId: ['', Validators.required],
      itemName: ['', Validators.required],
      category: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      totalCost: [{ value: 0, disabled: true }],
      storeId: ['', Validators.required],
      location: [''],
      notes: [''],
      entryDate: [new Date(), Validators.required]
    });

    // Calculate total cost when quantity or unit cost changes
    this.form.get('quantity')?.valueChanges.subscribe(() => this.calculateTotalCost());
    this.form.get('unitCost')?.valueChanges.subscribe(() => this.calculateTotalCost());
  }

  ngOnInit() {
    // Check if editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.isEditing = true;
      this.editingId = id;
      this.loadExisting(id);
    }
  }

  private loadExisting(id: number) {
    this.accountingService.getOpeningBalancesInventory().subscribe({
      next: (balances) => {
        const item = balances.find(b => b.id === id);
        if (item) {
          this.isEditing = true;
          this.editingId = id;
          this.form.patchValue({
            itemId: item.itemId,
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            storeId: item.storeId,
            location: item.location,
            notes: item.notes,
            entryDate: item.entryDate ? new Date(item.entryDate) : new Date()
          });
        }
      },
      error: (err) => {
        console.error('Failed to load opening balance for edit', err);
      }
    });
  }

  calculateTotalCost() {
    const quantity = this.form.get('quantity')?.value || 0;
    const unitCost = this.form.get('unitCost')?.value || 0;
    const totalCost = quantity * unitCost;
    this.form.get('totalCost')?.setValue(totalCost);
  }

  onStoreSelectionChange(storeId: number): void {
    const selectedStore = this.stores.find(s => s.id === storeId);
    if (selectedStore) {
      this.form.patchValue({ location: selectedStore.name });
    }
  }

  trackByStoreId(index: number, store: any): number {
    return store.id;
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
        storeId: formValue.storeId,
        entryDate: formValue.entryDate,
        // model uses 'location' field; no storeId in OpeningBalanceInventory

      };

      if (this.isEditing && this.editingId) {
        // Call update endpoint
        const updateDto: any = { id: this.editingId, ...balanceData };
        this.accountingService.updateOpeningBalanceInventory(this.editingId, updateDto).subscribe({
          next: (updated) => {
            this.router.navigate(['/inventory/opening-balances']);
          },
          error: (error) => {
            console.error('Error updating opening balance:', error);
          }
        });
      } else {
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