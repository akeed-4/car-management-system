import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DxDataGridModule, DxButtonModule, DxDataGridComponent } from 'devextreme-angular';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AccountingService } from '../accounting.service';
import { JournalEntry, JournalEntryLine, CreateJournalEntryDto, UpdateJournalEntryDto, Account, CreateJournalEntryLineDto } from '../models';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@/src/services/toast.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-journal-entries',
  templateUrl: './journal-entries.component.html',
  styleUrls: ['./journal-entries.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxDataGridModule,
    DxButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ]
})
export class JournalEntriesComponent implements OnInit {
  @ViewChild(DxDataGridComponent) grid: DxDataGridComponent;
  journalEntries$: Observable<JournalEntry[]>;
  accounts$: Observable<Account[]>;
  journalEntries: JournalEntry[] = [];

  journalEntryForm: FormGroup;
  isEditing = false;
  editingEntryId: number | null = null;
  accounts: Account[] = [];
  costCenters: any[] = []; // Assuming cost centers are loaded
  linesData: any[] = [];

  constructor(
    private accountingService: AccountingService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {
    this.journalEntries$ = this.accountingService.journalEntries$;
    this.accounts$ = this.accountingService.accounts$;

    this.journalEntryForm = this.fb.group({
      journalNumber: [''], // Add this
      date: [new Date(), Validators.required],
      reference: [''],
      status: ['draft', Validators.required], // Add this
      description: ['', [Validators.required, Validators.minLength(5)]],
      costCenter: [null], // Add this
      lines: this.fb.array([])
    });
  }

  ngOnInit() {
    this.journalEntries$.subscribe(entries => {
      this.journalEntries = entries;
    });

    this.accounts$.subscribe(accounts => {
      this.accounts = accounts;
      // Refresh grid to update calculated values
      if (this.grid) {
        this.grid.instance.refresh();
      }
    });

    // Ensure accounts are loaded
    this.accountingService.getAccounts().subscribe();

    // Load cost centers if needed
    // this.accountingService.getCostCenters().subscribe(cc => this.costCenters = cc);

    this.addLine(); // Add initial line

    // Check for route param ID
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditing = true;
        this.editingEntryId = +id;
        this.accountingService.getJournalEntryById(+id).subscribe({
          next: (entry) => {
            if (entry) {
              this.onEditEntry(entry);
            } else {
              console.error('Journal entry not found');
              // Perhaps navigate back or show error
            }
          },
          error: (error) => {
            console.error('Failed to fetch journal entry:', error);
            // Handle error, perhaps show message or navigate back
          }
        });
      }
    });
  }

  get lines(): FormArray {
    return this.journalEntryForm.get('lines') as FormArray;
  }

  addLine() {
    const lineForm = this.fb.group({
      accountId: [null, Validators.required],
      debit: [0, [Validators.required, Validators.min(0)]],
      credit: [0, [Validators.required, Validators.min(0)]],
      costCenter: [null], // Add this
      description: ['']
    });

    this.lines.push(lineForm);
    const lineNumber = this.linesData.length + 1;
    this.linesData.push({
      lineNumber: lineNumber,
      accountId: null,
      debit: 0,
      credit: 0,
      costCenter: null,
      description: ''
    });
  }

  removeLine(index: number) {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
      this.linesData.splice(index, 1);
    }
  }

  getAccountName(accountCode: number): string {
    const account = this.accounts.find(acc => acc.id === accountCode);
    return account ? account.accountNameEn : '';
  }

  getAccountCode(accountId: number): string {
    const account = this.accounts.find(acc => acc.id === accountId);
    return account ? account.accountCode : '';
  }

  get totalDebit(): number {
    return this.lines.controls.reduce((sum, control) => sum + (control.get('debit')?.value || 0), 0);
  }

  get totalCredit(): number {
    return this.lines.controls.reduce((sum, control) => sum + (control.get('credit')?.value || 0), 0);
  }

  get isBalanced(): boolean {
    return this.totalDebit === this.totalCredit;
  }

  onAddEntry() {
    // Load from localStorage if exists
    const saved = localStorage.getItem('journalEntryDraft');
    if (saved) {
      const draft = JSON.parse(saved);
      this.journalEntryForm.patchValue(draft.form);
      this.linesData = draft.linesData || [];
      // Rebuild form array
      while (this.lines.length > 0) {
        this.lines.removeAt(0);
      }
      this.linesData.forEach(line => {
        this.lines.push(this.fb.group({
          accountId: [line.accountId, Validators.required],
          debit: [line.debit, [Validators.required, Validators.min(0)]],
          credit: [line.credit, [Validators.required, Validators.min(0)]],
          costCenter: [line.costCenter],
          description: [line.description]
        }));
      });
    } else {
      this.isEditing = false;
      this.editingEntryId = null;
      this.journalEntryForm.reset({
        journalNumber: '',
        date: new Date(),
        reference: '',
        status: 'draft',
        description: '',
        costCenter: null,
        lines: []
      });
      while (this.lines.length > 0) {
        this.lines.removeAt(0);
      }
      this.linesData = [];
      this.addLine();
    }
  }

  onEditEntry(entry: JournalEntry) {
    if (!entry) return;

    this.isEditing = true;
    this.editingEntryId = entry.id;

    // Set form values with correct property names from API
    this.journalEntryForm.patchValue({
      journalNumber: entry.journalEntryNumber ?? '',
      date: new Date(entry.journalDate),
      reference: entry.referenceNumber ?? '',
      status: entry.status ?? 'draft',
      description: entry.description ?? '',
      costCenter: entry.costCenterId ?? null
    });

    // Clear existing lines
    while (this.lines.length > 0) {
      this.lines.removeAt(0);
    }
    this.linesData = [];

    // Populate lines from entry with correct property mappings
    if (entry.lines && entry.lines.length > 0) {
      entry.lines.forEach((line: JournalEntryLine, index: number) => {
        // Add to FormArray - use debitAmount/creditAmount from API
        console.log('Adding line to form:', line);
        const lineForm = this.fb.group({
          accountId: [line.accountId, Validators.required],
          accountCode: [line.accountCode ?? ''],
          debit: [line.debitAmount || line.debit || 0, [Validators.required, Validators.min(0)]],
          credit: [line.creditAmount || line.credit || 0, [Validators.required, Validators.min(0)]],
          costCenter: [line.costCenterId ?? null],
          description: [line.lineDescription ?? line.description ?? '']
        });
        this.lines.push(lineForm);

        // Add to grid data with all properties from API
        this.linesData.push({
          lineNumber: line.lineNumber || (index + 1),
          accountId: line.accountId,
          accountCode: line.accountCode ?? '',
          accountName: line.accountNameAr ?? '',
          debit: line.debitAmount || line.debit || 0,
          credit: line.creditAmount || line.credit || 0,
          costCenter: line.costCenterId ?? null,
          description: line.lineDescription ?? line.description ?? ''
        });
      });
    }

    // Refresh grid to display all data
    setTimeout(() => {
      if (this.grid?.instance) {
        this.grid.instance.refresh();
      }
    }, 100);
  }

  onSaveEntry() {
    if (this.journalEntryForm.valid && this.isBalanced && this.lines.length >= 2) {
      const formValue = this.journalEntryForm.value;
      const lines: CreateJournalEntryLineDto[] = formValue.lines.map((line: any) => ({
        AccountId: line.accountId,
        DebitAmount: line.debit,
        CreditAmount: line.credit,
        CostCenterId: line.costCenter || undefined,
        LineDescription: line.description || undefined
      }));

      if (this.isEditing && this.editingEntryId) {
        const updateDto: UpdateJournalEntryDto = {
          id: this.editingEntryId,
          JournalDate: new Date(formValue.date),
          ReferenceNumber: formValue.reference || undefined,
          Description: formValue.description,
          CostCenterId: formValue.costCenter || undefined,
          Lines: lines
        };
        this.accountingService.updateJournalEntry(updateDto).subscribe({
          next: () => {
            this.toastService.showSuccess('ACCOUNTING.JOURNAL_ENTRY_UPDATED');
            localStorage.removeItem('journalEntryDraft');
            this.router.navigate(['accounts/journal-entries-list']);
          },
          error: (error) => {
            console.error('Failed to update journal entry:', error);
            this.toastService.showError('ACCOUNTING.ERROR_UPDATING_ENTRY');
          }
        });
      } else {
        const createDto: CreateJournalEntryDto = {
          JournalDate: new Date(formValue.date),
          ReferenceNumber: formValue.reference || undefined,
          Description: formValue.description,
          CostCenterId: formValue.costCenter || undefined,
          Lines: lines
        };
        this.accountingService.createJournalEntry(createDto).subscribe({
          next: () => {
            this.toastService.showSuccess('ACCOUNTING.JOURNAL_ENTRY_CREATED');
            localStorage.removeItem('journalEntryDraft');
            this.onAddEntry();
          },
          error: (error) => {
            console.error('Failed to create journal entry:', error);
            this.toastService.showError('ACCOUNTING.ERROR_CREATING_ENTRY');
          }
        });
      }
    }
  }

  onDeleteEntry(entry: JournalEntry) {
    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE_ENTRY'))) {
      this.accountingService.deleteJournalEntry(entry.id).subscribe({
        next: () => {
          this.toastService.showSuccess('ACCOUNTING.JOURNAL_ENTRY_DELETED');
          // Refresh the list
          this.accountingService.getJournalEntries().subscribe();
        },
        error: (error) => {
          this.toastService.showError('ACCOUNTING.ERROR_DELETING_ENTRY');
        }
      });
    }
  }

  onCancel() {
    this.onAddEntry();
    this.router.navigate(['accounts/journal-entries-list']);
  }

  // DevExtreme DataGrid methods

  calculateAccountName(rowData: any) {
    if (!this.accounts || !rowData.accountId) return '';
    const account = this.accounts.find(acc => acc.id === rowData.accountId);
    return account ? account.accountNameEn : '';
  }

  calculateAccountCode(rowData: any) {
    if (!this.accounts || !rowData.accountId) return '';
    const account = this.accounts.find(acc => acc.id === rowData.accountId);
    return account ? account.accountCode : '';
  }

  calculateAccountDisplay(rowData: any) {
    if (!rowData?.accountId || !this.accounts) return '';
    const account = this.accounts.find(a => a.id === rowData.accountId);
    return account ? account.accountNameEn : '';
  }

  onRowRemoved(e: any) {
    if (!this.linesData) return;
    const index = this.linesData.indexOf(e.data);
    if (index >= 0) {
      this.lines.removeAt(index);
      this.linesData.splice(index, 1);
      // Update line numbers
      this.linesData.forEach((line, i) => {
        line.lineNumber = i + 1;
      });
    }
  }

  onRowUpdated(e: any) {
    if (!this.linesData) return;
    const index = this.linesData.indexOf(e.data);
    if (index >= 0) {
      const formGroup = this.lines.at(index);
      formGroup.patchValue(e.data);
      this.saveDraft();
    }
    // Refresh the grid to ensure all updates are reflected
    if (this.grid) {
      this.grid.instance.refresh();
    }
  }

  saveDraft() {
    const draft = {
      form: this.journalEntryForm.value,
      linesData: this.linesData
    };
    localStorage.setItem('journalEntryDraft', JSON.stringify(draft));
  }

  onCellPrepared(e: any) {
    // Optional: customize cell appearance
  }

  get difference(): number {
    return this.totalDebit - this.totalCredit;
  }
}