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

  statusOptions = [
    { value: 'Draft', text: this.translate.instant('ACCOUNTING.STATUS_DRAFT') },
    { value: 'Posted', text: this.translate.instant('ACCOUNTING.STATUS_POSTED') },
    { value: 'Approved', text: this.translate.instant('ACCOUNTING.STATUS_APPROVED') },
    { value: 'Rejected', text: this.translate.instant('ACCOUNTING.STATUS_REJECTED') }
  ];

  constructor(private accountingService: AccountingService, private router: Router, public translate: TranslateService) {
    this.onAddNew = this.onAddNew.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onEdit = this.onEdit.bind(this);
  }

  // Check if edit button should be visible for a journal entry
  isEditButtonVisible(data: any): boolean {
    return data.isGeneratedDynamically;
  }

  // DevExtreme DataGrid columns configuration with translation
 


  ngOnInit(): void {
    this.loadJournalEntries();
  }

  loadJournalEntries(): void {
    this.accountingService.getJournalEntries().subscribe({
      next: (entries) => {
        console.log('Loaded journal entries:', entries);
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

  onEdit(e: any): void {
    // Navigate to edit form with entry ID
    this.router.navigate(['accounts/journal-entries', e.row.data.id]);
  }

  onDelete(e: any): void {
    const entry = e.row.data;
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