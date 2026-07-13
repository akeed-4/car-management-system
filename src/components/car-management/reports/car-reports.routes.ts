import { Routes } from '@angular/router';
import { CAR_REPORTS } from '../../../models/reportmodel/car-reports.config';

export const CAR_REPORTS_ROUTES: Routes = CAR_REPORTS.map(report => ({
  path: report.route,
  loadComponent: () =>
    import('./report-viewer/report-viewer.component').then(m => m.ReportViewerComponent),
  data: { reportKey: report.key },
}));
