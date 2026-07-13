import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CarReportShellComponent } from '../shared/car-report-shell/car-report-shell.component';
import { CarReportsDataService } from '../../../../services/car-reports-data.service';
import { NotificationService } from '../../../../services/notification.service';
import { PermissionService } from '../../../../services/permission.service';
import { CAR_REPORTS, CarReportEntry } from '../../../../models/reportmodel/car-reports.config';
import { ReportFilters } from '../../../../models/reportmodel/car-report.types';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule, TranslateModule, CarReportShellComponent],
  templateUrl: './report-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(CarReportsDataService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);

  report = signal<CarReportEntry | undefined>(undefined);
  rows = signal<any[]>([]);
  loading = signal(false);
  canExportExcel = true;
  canExportPdf = true;
  canPrint = true;
  private currentFilters: ReportFilters = {};

  ngOnInit(): void {
    const key = this.route.snapshot.data['reportKey'] as string;
    const config = CAR_REPORTS.find(r => r.key === key);
    this.report.set(config);
    if (config) {
      this.canExportExcel = this.permissionService.hasPermission(`${config.permissionPrefix}.exportExcel`);
      this.canExportPdf = this.permissionService.hasPermission(`${config.permissionPrefix}.exportPdf`);
      this.canPrint = this.permissionService.hasPermission(`${config.permissionPrefix}.print`);
      this.load();
    }
  }

  load(): void {
    const config = this.report();
    if (!config) return;
    this.loading.set(true);
    this.dataService.resolveRows(config.dataSource, this.currentFilters).subscribe({
      next: rows => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('CAR_REPORTS.LOAD_FAILED'));
      },
    });
  }

  onFiltersChange(filters: ReportFilters): void {
    this.currentFilters = filters;
    this.load();
  }
}
