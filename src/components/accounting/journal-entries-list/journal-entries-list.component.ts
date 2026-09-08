import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { ResponsiveService } from '../../../services/responsive.service';
import { SharedMobileListComponent } from '../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../shared/shared-mobile-list/shared-mobile-list.model';

@Component({
  selector: 'app-journal-entries-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedDataGridComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    HasPermissionDirective,
    SharedMobileListComponent
  ],
  templateUrl: './journal-entries-list.component.html',
  styleUrls: ['./journal-entries-list.component.css']
})
export class JournalEntriesListComponent implements OnInit {

  permissionService = inject(PermissionService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  journalEntries = signal<JournalEntry[]>([]);
  filter = signal('');

  /** Client-side search over the same fields the grid's built-in search panel covers,
   *  used only to drive the mobile list (the desktop grid does its own search). */
  filteredJournalEntries = computed(() => {
    const term = this.filter().toLowerCase();
    const entries = this.journalEntries();
    if (!term) return entries;
    return entries.filter(e =>
      String(e.id ?? '').toLowerCase().includes(term) ||
      (e.description ?? '').toLowerCase().includes(term) ||
      (e.status ?? '').toLowerCase().includes(term)
    );
  });

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

  /** Same field set as the desktop grid's visible columns (status resolved via the same
   *  statusOptions lookup used by the grid's `lookup` column config). */
  mobileFields: MobileListFieldDto<JournalEntry>[] = [
    { label: 'ACCOUNTING.ENTRY_DATE', value: (e) => e.entryDate, type: 'date' },
    { label: 'ACCOUNTING.DESCRIPTION', value: (e) => e.description },
    { label: 'ACCOUNTING.AMOUNT', value: (e) => e.totalCredit, type: 'currency' },
    {
      label: 'ACCOUNTING.STATUS',
      value: (e) => this.statusOptions.find(s => s.value === e.status)?.text ?? e.status,
      type: 'status',
      statusClass: (e) => this.journalStatusClass(e.status),
    },
  ];

  /** Same edit/delete actions as the desktop grid's row actions. */
  mobileActions: MobileListActionDto<JournalEntry>[] = [
    { id: 'edit', icon: 'edit', labelKey: 'ACCOUNTING.EDIT', visible: () => this.permissionService.hasPermission('journalentries.view') },
    { id: 'delete', icon: 'delete', labelKey: 'ACCOUNTING.DELETE', visible: () => this.permissionService.hasPermission('journalentries.view') },
  ];

  mobileTitleOf = (e: JournalEntry) => String(e.id);
  mobileTrackBy = (index: number, e: JournalEntry) => e.id ?? index;

  onMobileAction(e: MobileListActionEvent<JournalEntry>): void {
    const wrapped = { row: { data: e.item } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }

  /** Maps journal-entry status to the MobileListFieldDto statusClass vocabulary
   *  (success/warning/danger/neutral). */
  private journalStatusClass(status: string): string {
    switch (status) {
      case 'Posted':
      case 'Approved':
        return 'success';
      case 'Draft':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'neutral';
    }
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
