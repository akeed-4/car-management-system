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
import { AccountingService } from '@/src/services/accounting.service';
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
    // TODO: Implement API call
    // For now, using mock data
    this.openingBalances.set([
      {
        id: 1,
        itemId: 2001,
        itemName: 'Toyota Camry 2020',
        category: 'CAR',
        quantity: 5,
        unitCost: 150000,
        totalCost: 750000,
        location: 'SHOWROOM_A',
        notes: 'Initial car inventory',
        entryDate: new Date('2024-01-01')
      },
      {
        id: 2,
        itemId: 2002,
        itemName: 'Engine Oil Filter',
        category: 'SPARE_PART',
        quantity: 100,
        unitCost: 50,
        totalCost: 5000,
        location: 'WAREHOUSE',
        notes: 'Spare parts inventory',
        entryDate: new Date('2024-01-01')
      }
    ]);
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
      // TODO: Implement delete API call
      const current = this.openingBalances();
      this.openingBalances.set(current.filter(item => item.id !== data.id));
    }
  }

  onSave() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const balance: OpeningBalanceInventory = {
        ...formValue,
        totalCost: formValue.quantity * formValue.unitCost,
        id: this.editingId || Date.now() // Mock ID
      };

      if (this.isEditing) {
        // Update existing
        const current = this.openingBalances();
        const index = current.findIndex(item => item.id === this.editingId);
        if (index !== -1) {
          current[index] = balance;
          this.openingBalances.set([...current]);
        }
      } else {
        // Add new
        this.openingBalances.set([...this.openingBalances(), balance]);
      }

      this.onCancel();
    }
  }

  onCancel() {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset();
  }
}