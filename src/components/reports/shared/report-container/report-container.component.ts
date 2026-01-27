import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { ReportFilter } from '@/src/models/reportmodel';

@Component({
  selector: 'app-report-container',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './report-container.component.html',
  styleUrls: ['./report-container.component.css']
})
export class ReportContainerComponent implements OnInit {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = 'assessment';
  @Input() showDateRange: boolean = true;
  @Input() showAccountFilter: boolean = false;
  @Input() showBranchFilter: boolean = true;
  @Input() showCostCenterFilter: boolean = false;
  @Input() customFilters: any[] = [];
  @Input() loading: boolean = false;
  
  @Output() filterChange = new EventEmitter<ReportFilter>();
  @Output() exportPdf = new EventEmitter<void>();
  @Output() exportExcel = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  filterForm!: FormGroup;
  branches: any[] = [];
  accounts: any[] = [];
  costCenters: any[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilterData();
  }

  /**
   * Initialize filter form
   */
  private initializeForm(): void {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      accountId: [null],
      branchId: [null],
      costCenterId: [null]
    });

    // Add custom filters dynamically
    this.customFilters.forEach(filter => {
      this.filterForm.addControl(filter.name, this.fb.control(null));
    });

    // Emit filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.onApplyFilter();
    });
  }

  /**
   * Load filter data (branches, accounts, etc.)
   */
  private loadFilterData(): void {
    // TODO: Load from services
    // For now, mock data
    this.branches = [];
    this.accounts = [];
    this.costCenters = [];
  }

  /**
   * Apply filters
   */
  onApplyFilter(): void {
    if (this.filterForm.valid) {
      const filters: ReportFilter = this.filterForm.value;
      this.filterChange.emit(filters);
    }
  }

  /**
   * Reset filters
   */
  onResetFilter(): void {
    this.filterForm.reset();
    this.onApplyFilter();
  }

  /**
   * Export to PDF
   */
  onExportPdf(): void {
    this.exportPdf.emit();
  }

  /**
   * Export to Excel
   */
  onExportExcel(): void {
    this.exportExcel.emit();
  }

  /**
   * Print report
   */
  onPrint(): void {
    this.print.emit();
  }

  /**
   * Refresh report data
   */
  onRefresh(): void {
    this.refresh.emit();
  }
}
