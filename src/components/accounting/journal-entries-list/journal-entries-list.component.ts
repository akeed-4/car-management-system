import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountingService } from '../accounting.service';
import { JournalEntry } from '../models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-journal-entries-list',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './journal-entries-list.component.html',
  styleUrls: ['./journal-entries-list.component.css']
})
export class JournalEntriesListComponent implements OnInit {

  journalEntries = signal<JournalEntry[]>([]);

  constructor(private accountingService: AccountingService, private router: Router, public translate: TranslateService) {
    this.onAddNew = this.onAddNew.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onEdit = this.onEdit.bind(this);
  }

  // DevExtreme DataGrid columns configuration with translation
  get columns() {
    return [
      {
        dataField: 'id',
        caption: this.translate.instant('ACCOUNTING.ID'),
        dataType: 'number',
        width: 80
      },
      {
        dataField: 'date',
        caption: this.translate.instant('ACCOUNTING.DATE'),
        dataType: 'date',
        format: 'dd/MM/yyyy'
      },
      {
        dataField: 'reference',
        caption: this.translate.instant('ACCOUNTING.REFERENCE')
      },
      {
        dataField: 'description',
        caption: this.translate.instant('ACCOUNTING.DESCRIPTION')
      },
      {
        dataField: 'totalDebit',
        caption: this.translate.instant('ACCOUNTING.TOTAL_DEBIT'),
        dataType: 'number',
        format: { type: 'currency', currency: 'SAR', precision: 2 }
      },
      {
        dataField: 'totalCredit',
        caption: this.translate.instant('ACCOUNTING.TOTAL_CREDIT'),
        dataType: 'number',
        format: { type: 'currency', currency: 'SAR', precision: 2 }
      },
      {
        dataField: 'status',
        caption: this.translate.instant('ACCOUNTING.STATUS')
      },
      {
        dataField: 'createdAt',
        caption: this.translate.instant('ACCOUNTING.CREATED_AT'),
        dataType: 'date',
        format: 'dd/MM/yyyy HH:mm'
      },
      {
        caption: this.translate.instant('ACCOUNTING.ACTIONS'),
        type: 'buttons',
        buttons: [
          {
            hint: this.translate.instant('ACCOUNTING.VIEW_DETAILS'),
            icon: 'eye',
            onClick: (e: any) => this.onViewDetails(e.row.data)
          },
          {
            hint: this.translate.instant('ACCOUNTING.EDIT'),
            icon: 'edit',
            onClick: (e: any) => this.onEdit(e.row.data)
          },
          {
            hint: this.translate.instant('ACCOUNTING.DELETE'),
            icon: 'trash',
            onClick: (e: any) => this.onDelete(e.row.data)
          }
        ]
      }
    ];
  }


  ngOnInit(): void {
    this.loadJournalEntries();
  }

  loadJournalEntries(): void {
    this.accountingService.getJournalEntries().subscribe({
      next: (entries) => {
        this.journalEntries.set(entries);
      },
      error: (error) => {
        console.error('Error loading journal entries:', error);
      }
    });
  }

  onViewDetails(entry: JournalEntry): void {
    // Navigate to detail view or open modal
    console.log('View details:', entry);
  }

  onEdit(entry: JournalEntry): void {
    // Navigate to edit form with entry ID
    this.router.navigate(['accounts/journal-entries', entry.id]);
  }

  onDelete(entry: JournalEntry): void {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      this.accountingService.deleteJournalEntry(entry.id).subscribe({
        next: () => {
          this.loadJournalEntries(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting journal entry:', error);
        }
      });
    }
  }
 

  onAddNew(): void {
    // Navigate to create form
    this.router.navigate(['accounts/journal-entries']);
  }
}