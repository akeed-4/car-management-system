import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CarReportsDataService } from '../../../../../services/car-reports-data.service';
import { ReportFilterFieldConfig, ReportFilters } from '../../../../../models/reportmodel/car-report.types';

const CAR_STATUS_OPTIONS = ['Available', 'Reserved', 'Sold', 'In Maintenance', 'Offered'];
const SALES_STATUS_OPTIONS = ['Paid', 'Pending', 'Overdue'];

@Component({
  selector: 'app-report-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './report-filter-panel.component.html',
  styleUrl: './report-filter-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFilterPanelComponent implements OnChanges {
  @Input({ required: true }) fields: ReportFilterFieldConfig[] = [];
  @Input() filters: ReportFilters = {};
  @Output() filtersChange = new EventEmitter<ReportFilters>();
  @Output() search = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  private data = inject(CarReportsDataService);

  model: ReportFilters = {};
  carStatusOptions = CAR_STATUS_OPTIONS;
  salesStatusOptions = SALES_STATUS_OPTIONS;

  get branches() { return this.data.branches(); }
  get warehouses() { return this.data.warehouses(); }
  get suppliers() { return this.data.suppliers(); }
  get brands() { return this.data.brands(); }
  get carModels() { return this.data.carModels(); }
  get categories() { return this.data.categories(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.model = { ...this.filters };
    }
  }

  hasField(key: string): boolean {
    return this.fields.some(f => f.key === key);
  }

  onSearch(): void {
    this.filtersChange.emit({ ...this.model });
    this.search.emit();
  }

  onClear(): void {
    this.model = {};
    this.filtersChange.emit({});
    this.clear.emit();
  }
}
