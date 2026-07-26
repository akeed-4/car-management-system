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
import { firstValueFrom } from 'rxjs';
import { ConsignmentService } from '../../../services/consignment.service';
import { ConsignmentSaleService } from '../../../services/consignment-sale.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { ConsignmentCar } from '../../../models/consignment-car.model';
import { getConsignmentStatusClass } from '../consignment-status.util';
import { ConsignmentSaleDialogComponent } from '../consignment-sale-dialog/consignment-sale-dialog.component';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/AuthService.service';
import { TranslateService } from '@ngx-translate/core';

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
  private consignmentSaleService = inject(ConsignmentSaleService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  statusFilter = signal<string>('');

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  lastLoadedRows = signal<ConsignmentCar[]>([]);

  readonly gridStateKey = 'consignmentCarsGridState';

  statusOptions = ['Available', 'Reserved', 'Sold', 'Returned'];

  dataSource = new CustomStore<ConsignmentCar>({
    key: 'id',
    load: async (loadOptions) => {
      const options: Record<string, unknown> = { ...loadOptions };

      if (this.statusFilter()) {
        const statusFilterExpr = ['status', '=', this.statusFilter()];
        const existing = options['filter'];
        options['filter'] = existing ? [existing, 'and', statusFilterExpr] : statusFilterExpr;
      }

      const result = await firstValueFrom(this.consignmentService.loadDataGrid(options));
      this.lastLoadedRows.set(result?.data ?? []);
      return {
        data: result?.data ?? [],
        totalCount: result?.totalCount ?? 0,
      };
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

  /** Available/Reserved only -- the dialog posts the commission journal entry and flips the
   * vehicle to Sold server-side; no direct status edit ever reaches this from the UI. */
  canSell(car: ConsignmentCar): boolean {
    return car.status === 'Available' || car.status === 'Reserved';
  }

  sellCar(car: ConsignmentCar): void {
    const ref = this.dialog.open(ConsignmentSaleDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { car },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.notificationService.showSuccess(this.translate.instant('CONSIGNMENT.SALE.SUCCESS'));
        this.refresh();
      }
    });
  }

  cancelSale(car: ConsignmentCar): void {
    if (!car.id) return;
    this.findActiveSaleAndReverse(car, 'cancel');
  }

  returnCar(car: ConsignmentCar): void {
    if (!car.id) return;
    this.findActiveSaleAndReverse(car, 'return');
  }

  /** The ConsignmentCar grid doesn't carry its ConsignmentSale.Id directly, so the active
   * (Posted) sale for this car is looked up first via the grid endpoint filtered by car -- same
   * dual-mode GetAll used everywhere else, just called for a single-page lookup here. */
  private findActiveSaleAndReverse(car: ConsignmentCar, action: 'cancel' | 'return'): void {
    this.consignmentSaleService
      .loadDataGrid({ filter: [['consignmentCarId', '=', car.id], 'and', ['status', '=', 'Posted']] })
      .subscribe((result) => {
        const sale = result.data?.[0];
        if (!sale) {
          this.notificationService.showError(this.translate.instant('CONSIGNMENT.SALE.NO_ACTIVE_SALE'));
          return;
        }
        const userId = this.authService.currentUser()?.id ?? 0;
        const call = action === 'cancel'
          ? this.consignmentSaleService.cancel(sale.id, userId)
          : this.consignmentSaleService.return(sale.id, userId);
        call.subscribe({
          next: (response) => {
            if (response.success) {
              this.notificationService.showSuccess(
                this.translate.instant(action === 'cancel' ? 'CONSIGNMENT.SALE.CANCELLED' : 'CONSIGNMENT.SALE.RETURNED')
              );
              this.refresh();
            } else {
              this.notificationService.showError(response.message);
            }
          },
          error: (err) => this.notificationService.showError(err?.error?.message ?? err?.message ?? 'Error'),
        });
      });
  }
}
