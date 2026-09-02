import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AccountingService } from '../accounting.service';
import { JournalEntry } from '../models';
import { Router } from '@angular/router';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
import { PermissionService } from '../../../services/permission.service';
import { HasPermissionDirective } from '../../shared/permission.directive';

@Component({
  selector: 'app-journal-entries-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedDataGridComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    HasPermissionDirective
  ],
  templateUrl: './journal-entries-list.component.html',
  styleUrls: ['./journal-entries-list.component.css']
})
export class JournalEntriesListComponent implements OnInit {

  permissionService = inject(PermissionService);

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
    return data.isGeneratedDynamically !== true; // Hide edit button for dynamically generated entries
  }

  /** Config-driven columns -- same fields/formats/lookup as the previous dx-data-grid. */
  columns: dataGridColumnDto[] = [
    { dataField: 'id', dataType: 'number', caption: 'ACCOUNTING.ENTRY_NUMBER', width: 120, alignment: 'right' },
    { dataField: 'entryDate', dataType: 'date', format: 'yyyy-MM-dd', caption: 'ACCOUNTING.ENTRY_DATE', width: 120, alignment: 'right' },
    { dataField: 'description', dataType: 'string', caption: 'ACCOUNTING.DESCRIPTION', minWidth: 200, alignment: 'right' },
    { dataField: 'totalCredit', dataType: 'number', format: { type: 'currency', currency: 'SAR' }, caption: 'ACCOUNTING.AMOUNT', width: 130, alignment: 'right' },
    {
      dataField: 'status', dataType: 'string', caption: 'ACCOUNTING.STATUS', width: 100, alignment: 'center',
      lookup: { dataSource: this.statusOptions, valueExpr: 'value', displayExpr: 'text' },
    },
    { dataField: '__actions', dataType: 'string', caption: 'ACCOUNTING.ACTIONS', type: 'actions', width: 120, allowSorting: false, allowFiltering: false },
  ];

  /** Same edit/delete buttons as before. NOTE: the original `isEditButtonVisible` read
   *  `data.isGeneratedDynamically` off the DevExtreme button-visibility options object
   *  (`{component, row, column}`), which has no such property -- so both buttons were
   *  always visible regardless of isGeneratedDynamically. Preserved that literal (buggy)
   *  behavior here rather than wiring in a newly-functioning check that would change it. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'ACCOUNTING.EDIT', visible: () => this.permissionService.hasPermission('journalentries.view') },
    { id: 'delete', icon: 'delete', labelKey: 'ACCOUNTING.DELETE', visible: () => this.permissionService.hasPermission('journalentries.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }

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
