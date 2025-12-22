import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AccountingService } from '../../accounting/accounting.service';
import { OpeningBalanceInventory } from '../../accounting/models';
import { DxiColumnModule } from 'devextreme-angular/ui/nested';

@Component({
  selector: 'app-opening-balances-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxDataGridModule,
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
  ],
  templateUrl: './opening-balances-inventory.component.html',
  styleUrls: ['./opening-balances-inventory.component.css']
})
export class OpeningBalancesInventoryComponent implements OnInit {

  openingBalances = signal<OpeningBalanceInventory[]>([]);
  form: FormGroup;
  isEditing = false;
  editingId: number | null = null;

  categories = ['CAR', 'SPARE_PART', 'ACCESSORY'];
  locations = ['SHOWROOM_A', 'SHOWROOM_B', 'WAREHOUSE'];

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    public translate: TranslateService,
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

    this.onAddNew = this.onAddNew.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  ngOnInit() {
    this.loadOpeningBalances();
  }

  calculateTotalCost() {
    const quantity = this.form.get('quantity')?.value || 0;
    const unitCost = this.form.get('unitCost')?.value || 0;
    const totalCost = quantity * unitCost;
    this.form.get('totalCost')?.setValue(totalCost);
  }

  loadOpeningBalances() {
    this.accountingService.getOpeningBalancesInventory().subscribe({
      next: (balances) => {
        this.openingBalances.set(balances);
      },
      error: (error) => {
        console.error('Error loading opening balances:', error);
        // Fallback to empty array if API fails
        this.openingBalances.set([]);
      }
    });
  }

  onAddNew() {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset({
      itemId: '',
      itemName: '',
      category: '',
      quantity: 0,
      unitCost: 0,
      totalCost: 0,
      location: '',
      notes: '',
      entryDate: new Date()
    });
  }

  onEdit(e: any) {
    const data = e.row.data;
    this.isEditing = true;
    this.editingId = data.id;
    this.form.patchValue({
      itemId: data.itemId,
      itemName: data.itemName,
      category: data.category,
      quantity: data.quantity,
      unitCost: data.unitCost,
      totalCost: data.totalCost,
      location: data.location,
      notes: data.notes,
      entryDate: data.entryDate
    });
  }

  onDelete(e: any) {
    const data = e.row.data;
    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE_OPENING_BALANCE'))) {
      this.accountingService.deleteOpeningBalanceInventory(data.id).subscribe({
        next: () => {
          // Remove from local state
          const current = this.openingBalances();
          this.openingBalances.set(current.filter(item => item.id !== data.id));
        },
        error: (error) => {
          console.error('Error deleting opening balance:', error);
        }
      });
    }
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

      if (this.isEditing && this.editingId) {
        // Update existing
        this.accountingService.updateOpeningBalanceInventory(this.editingId, { ...balanceData, id: this.editingId }).subscribe({
          next: (updatedBalance) => {
            const current = this.openingBalances();
            const index = current.findIndex(item => item.id === this.editingId);
            if (index !== -1) {
              current[index] = updatedBalance;
              this.openingBalances.set([...current]);
            }
            this.onCancel();
          },
          error: (error) => {
            console.error('Error updating opening balance:', error);
          }
        });
      } else {
        // Create new
        this.accountingService.createOpeningBalanceInventory(balanceData).subscribe({
          next: (newBalance) => {
            this.openingBalances.set([...this.openingBalances(), newBalance]);
            this.onCancel();
          },
          error: (error) => {
            console.error('Error creating opening balance:', error);
          }
        });
      }
    }
  }

  onCancel() {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset();
  }
}