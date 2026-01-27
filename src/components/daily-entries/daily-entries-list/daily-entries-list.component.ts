import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { DailyEntry, DailyEntryType } from '../../../models/daily-entry.model';
import { DailyEntryService } from '../../../services/daily-entry.service';
import { InventoryService } from '../../../services/inventory.service';

@Component({
  selector: 'app-daily-entries-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './daily-entries-list.component.html',
  styleUrls: ['./daily-entries-list.component.css']
})
export class DailyEntriesListComponent implements OnInit {
  private router = inject(Router);
  private dailyEntryService = inject(DailyEntryService);
  private inventoryService = inject(InventoryService);

  displayedColumns: string[] = ['entryDate', 'entryType', 'carInfo', 'details', 'actions'];

  dailyEntries = signal<DailyEntry[]>([]);
  filteredEntries = signal<DailyEntry[]>([]);

  // Filter properties
  selectedEntryType: string = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  searchTerm: string = '';

  ngOnInit() {
    this.loadDailyEntries();
  }

  loadDailyEntries() {
    this.dailyEntryService.getAll().subscribe(entries => {
      this.dailyEntries.set(entries);
      this.applyFilters();
    });
  }

  applyFilters() {
    let filtered = [...this.dailyEntries()];

    // Filter by entry type
    if (this.selectedEntryType) {
      filtered = filtered.filter(entry => entry.entryType === this.selectedEntryType);
    }

    // Filter by date range
    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(entry => new Date(entry.entryDate) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => new Date(entry.entryDate) <= toDate);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        this.getEntrySummary(entry).toLowerCase().includes(term) ||
        this.getCarInfo(entry.carId).toLowerCase().includes(term)
      );
    }

    this.filteredEntries.set(filtered);
  }

  getCarInfo(carId: number): string {
    // This would ideally come from a car service, but for now return a placeholder
    return `Car #${carId}`;
  }

  getEntrySummary(entry: DailyEntry): string {
    switch (entry.entryType) {
      case 'maintenance':
        return `Maintenance: ${(entry as any).maintenanceType} - $${(entry as any).cost}`;
      case 'ownership_transfer':
        return `Transfer to ${(entry as any).newOwnerName}`;
      case 'insurance':
        return `Insurance: ${(entry as any).insuranceCompany} - Policy ${(entry as any).policyNumber}`;
      case 'periodic_inspection':
        return `Inspection: ${(entry as any).inspectionResult} at ${(entry as any).inspectionCenter}`;
      default:
        return 'Unknown entry type';
    }
  }

  viewEntry(entry: DailyEntry) {
    this.router.navigate(['/daily-entries', entry.id]);
  }

  editEntry(entry: DailyEntry) {
    this.router.navigate(['/daily-entries', entry.id, 'edit']);
  }

  deleteEntry(entry: DailyEntry) {
    if (confirm('Are you sure you want to delete this entry?')) {
      this.dailyEntryService.deleteEntry(entry.id).subscribe(() => {
        this.loadDailyEntries();
      });
    }
  }
}
