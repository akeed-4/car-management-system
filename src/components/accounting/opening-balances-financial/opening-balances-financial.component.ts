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
import { AccountingService } from '../accounting.service';
import { OpeningBalanceFinancial } from '../models';

@Component({
  selector: 'app-opening-balances-financial',
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
    MatDialogModule
  ],
  templateUrl: './opening-balances-financial.component.html',
  styleUrls: ['./opening-balances-financial.component.css']
})
export class OpeningBalancesFinancialComponent implements OnInit {

  openingBalances = signal<OpeningBalanceFinancial[]>([]);
  form: FormGroup;
  isEditing = false;
  editingId: number | null = null;

  currencies = ['SAR', 'USD', 'EUR'];
  accountTypes = ['CASH', 'BANK', 'SUPPLIER', 'CUSTOMER', 'CAPITAL', 'PREPAID'];

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    public translate: TranslateService,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      accountId: ['', Validators.required],
      accountName: ['', Validators.required],
      openingBalance: [0, [Validators.required, Validators.min(0)]],
      currency: ['SAR', Validators.required],
      accountType: ['', Validators.required],
      notes: [''],
      entryDate: [new Date(), Validators.required]
    });

    this.onAddNew = this.onAddNew.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  ngOnInit() {
    this.loadOpeningBalances();
  }

  loadOpeningBalances() {
    this.accountingService.getOpeningBalancesFinancial().subscribe({
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
      accountId: '',
      accountName: '',
      openingBalance: 0,
      currency: 'SAR',
      accountType: '',
      notes: '',
      entryDate: new Date()
    });
  }

  onEdit(e: any) {
    const data = e.row.data;
    this.isEditing = true;
    this.editingId = data.id;
    this.form.patchValue({
      accountId: data.accountId,
      accountName: data.accountName,
      openingBalance: data.openingBalance,
      currency: data.currency,
      accountType: data.accountType,
      notes: data.notes,
      entryDate: data.entryDate
    });
  }

  onDelete(e: any) {
    const data = e.row.data;
    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE_OPENING_BALANCE'))) {
      this.accountingService.deleteOpeningBalanceFinancial(data.id).subscribe({
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
        accountId: formValue.accountId,
        accountName: formValue.accountName,
        openingBalance: formValue.openingBalance,
        currency: formValue.currency,
        accountType: formValue.accountType,
        notes: formValue.notes,
        entryDate: formValue.entryDate
      };

      if (this.isEditing && this.editingId) {
        // Update existing
        this.accountingService.updateOpeningBalanceFinancial(this.editingId, { ...balanceData, id: this.editingId }).subscribe({
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
        this.accountingService.createOpeningBalanceFinancial(balanceData).subscribe({
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