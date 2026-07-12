import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import CustomStore from 'devextreme/data/custom_store';
import {
  DxDataGridModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConsignmentService } from '../../../services/consignment.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { ConsignmentCar } from '../../../models/consignment-car.model';
import { getConsignmentStatusClass } from '../consignment-status.util';

@Component({
  selector: 'app-consignment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    HasPermissionDirective,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    DxDataGridModule,
    TranslateModule,
  ],
  templateUrl: './consignment-list.component.html',
  styleUrl: './consignment-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsignmentListComponent {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private consignmentService = inject(ConsignmentService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  statusFilter = signal<string>('');

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  lastLoadedRows = signal<ConsignmentCar[]>([]);

  readonly gridStateKey = 'consignmentCarsGridState';

  statusOptions = ['Available', 'Reserved', 'Sold', 'Returned'];

  dataSource = new CustomStore<ConsignmentCar>({
    key: 'id',
    load: (loadOptions) => {
      const options: Record<string, unknown> = { ...loadOptions };

      if (this.statusFilter()) {
        const statusFilterExpr = ['status', '=', this.statusFilter()];
        const existing = options['filter'];
        options['filter'] = existing ? [existing, 'and', statusFilterExpr] : statusFilterExpr;
      }

      return this.consignmentService.loadDataGrid(options).toPromise()
        .then(result => {
          this.lastLoadedRows.set(result?.data ?? []);
          return {
            data: result?.data ?? [],
            totalCount: result?.totalCount ?? 0,
          };
        });
    },
  });

  summary = computed(() => {
    const rows = this.lastLoadedRows();
    return {
      total: rows.length,
      available: rows.filter(r => r.status === 'Available').length,
      reserved: rows.filter(r => r.status === 'Reserved').length,
      sold: rows.filter(r => r.status === 'Sold').length,
      totalValue: rows.reduce((sum, r) => sum + (r.expectedSalePrice ?? 0), 0),
    };
  });

  getConsignmentStatusClass = getConsignmentStatusClass;

  newCar(): void {
    this.router.navigate(['/consignment-cars/new']);
  }

  editCar(id: number): void {
    this.router.navigate(['/consignment-cars/edit', id]);
  }

  openDetails(e: { data?: ConsignmentCar }): void {
    if (e.data) {
      this.editCar(e.data.id);
    }
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.consignmentService.delete(id).subscribe(() => {
        this.refresh();
      });
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }

  refresh(): void {
    this.grid?.instance?.refresh();
  }

  onStatusFilterChange(): void {
    this.refresh();
  }

  resetFilters(): void {
    this.statusFilter.set('');
    this.grid?.instance?.clearFilter();
    this.refresh();
  }

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ConsignmentCars');
        exportDataGrid({
          component: this.grid.instance,
          worksheet,
        }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'ConsignmentCars.xlsx');
            });
          });
        });
      });
    });
  }

  exportPdf(): void {
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({
        jsPDFDocument: doc,
        component: this.grid.instance,
      }).then(() => {
        doc.save('ConsignmentCars.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }

  openHistory(id: number): void {
    this.dialog.open(AuditHistoryPanelComponent, {
      data: { entityName: 'ConsignmentCar', entityId: id },
      width: '600px',
    });
  }
}
