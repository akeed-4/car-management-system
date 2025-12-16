import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AccountingService } from '../accounting.service';
import { JournalEntry, JournalEntryLine, CreateJournalEntryDto, UpdateJournalEntryDto, Account } from '../models';

@Component({
  selector: 'app-journal-entries',
  templateUrl: './journal-entries.component.html',
  styleUrls: ['./journal-entries.component.css']
})
export class JournalEntriesComponent implements OnInit {
  journalEntries$: Observable<JournalEntry[]>;
  accounts$: Observable<Account[]>;
  journalEntries: JournalEntry[] = [];

  // DevExtreme DataGrid columns configuration
  columns = [
    {
      dataField: 'date',
      caption: 'ACCOUNTING.DATE',
      dataType: 'date',
      format: 'short'
    },
    {
      dataField: 'description',
      caption: 'ACCOUNTING.DESCRIPTION'
    },
    {
      dataField: 'reference',
      caption: 'ACCOUNTING.REFERENCE'
    },
    {
      dataField: 'totalDebit',
      caption: 'ACCOUNTING.TOTAL_DEBIT',
      dataType: 'number',
      format: { type: 'currency', currency: 'SAR', precision: 2 }
    },
    {
      dataField: 'totalCredit',
      caption: 'ACCOUNTING.TOTAL_CREDIT',
      dataType: 'number',
      format: { type: 'currency', currency: 'SAR', precision: 2 }
    },
    {
      caption: 'ACCOUNTING.ACTIONS',
      type: 'buttons',
      buttons: [
        {
          hint: 'Edit',
          icon: 'edit',
          onClick: (e: any) => this.onEditEntry(e.row.data)
        },
        {
          hint: 'Delete',
          icon: 'trash',
          onClick: (e: any) => this.onDeleteEntry(e.row.data)
        }
      ]
    }
  ];

  journalEntryForm: FormGroup;
  isEditing = false;
  editingEntryId: number | null = null;
  accounts: Account[] = [];

  constructor(
    private accountingService: AccountingService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {
    this.journalEntries$ = this.accountingService.journalEntries$;
    this.accounts$ = this.accountingService.accounts$;

    this.journalEntryForm = this.fb.group({
      date: [new Date(), Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]],
      reference: [''],
      lines: this.fb.array([])
    });
  }

  ngOnInit() {
    this.journalEntries$.subscribe(entries => {
      this.journalEntries = entries;
    });

    this.accounts$.subscribe(accounts => {
      this.accounts = accounts;
    });

    this.addLine(); // Add initial line
  }

  get lines(): FormArray {
    return this.journalEntryForm.get('lines') as FormArray;
  }

  addLine() {
    const lineForm = this.fb.group({
      accountId: [null, Validators.required],
      debit: [0, [Validators.required, Validators.min(0)]],
      credit: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });

    this.lines.push(lineForm);
  }

  removeLine(index: number) {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  getAccountName(accountId: number): string {
    const account = this.accounts.find(acc => acc.id === accountId);
    return account ? account.accountNameEn : '';
  }

  getTotalDebit(): number {
    return this.lines.controls.reduce((sum, control) => sum + (control.get('debit')?.value || 0), 0);
  }

  getTotalCredit(): number {
    return this.lines.controls.reduce((sum, control) => sum + (control.get('credit')?.value || 0), 0);
  }

  isBalanced(): boolean {
    return this.getTotalDebit() === this.getTotalCredit();
  }

  onAddEntry() {
    this.isEditing = false;
    this.editingEntryId = null;
    this.journalEntryForm.reset({
      date: new Date(),
      description: '',
      reference: '',
      lines: []
    });
    while (this.lines.length > 0) {
      this.lines.removeAt(0);
    }
    this.addLine();
  }

  onEditEntry(entry: JournalEntry) {
    this.isEditing = true;
    this.editingEntryId = entry.id;

    this.journalEntryForm.patchValue({
      date: entry.date,
      description: entry.description,
      reference: entry.reference || ''
    });

    while (this.lines.length > 0) {
      this.lines.removeAt(0);
    }

    entry.lines.forEach(line => {
      const lineForm = this.fb.group({
        accountId: [line.accountId, Validators.required],
        debit: [line.debit, [Validators.required, Validators.min(0)]],
        credit: [line.credit, [Validators.required, Validators.min(0)]],
        description: [line.description || '']
      });
      this.lines.push(lineForm);
    });
  }

  onSaveEntry() {
    if (this.journalEntryForm.valid && this.isBalanced()) {
      const formValue = this.journalEntryForm.value;
      const lines = formValue.lines.map((line: any) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description
      }));

      if (this.isEditing && this.editingEntryId) {
        const updateDto: UpdateJournalEntryDto = {
          id: this.editingEntryId,
          date: formValue.date,
          description: formValue.description,
          reference: formValue.reference,
          lines
        };
        this.accountingService.updateJournalEntry(updateDto).subscribe();
      } else {
        const createDto: CreateJournalEntryDto = {
          date: formValue.date,
          description: formValue.description,
          reference: formValue.reference,
          lines
        };
        this.accountingService.createJournalEntry(createDto).subscribe();
      }

      this.onAddEntry(); // Reset form
    }
  }

  onDeleteEntry(entry: JournalEntry) {
    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE_ENTRY'))) {
      this.accountingService.deleteJournalEntry(entry.id).subscribe();
    }
  }

  onCancel() {
    this.onAddEntry();
  }
}