import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { NotificationService } from '@/src/services/notification.service';
import { DeliveryNoteResult } from '../../../../models/corporate/corporate-dispatch.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-corporate-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedDataGridComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './corporate-delivery-list.component.html',
  styleUrls: ['./corporate-delivery-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateDeliveryListComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  deliveryNotes = signal<DeliveryNoteResult[]>([]);
  loading = signal(false);

  /** Config-driven columns -- same fields as before (i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'deliveryNoteNumber', dataType: 'string', caption: 'CORPORATE.DELIVERY_NOTE_NUMBER' },
    { dataField: 'vin', dataType: 'string', caption: 'VIN' },
    { dataField: 'gatePassSerial', dataType: 'string', caption: 'CORPORATE.GATE_PASS_SERIAL' },
    { dataField: 'deliveryDate', dataType: 'date', caption: 'CORPORATE.DELIVERY_DATE' },
    { dataField: 'deliveredToName', dataType: 'string', caption: 'CORPORATE.RECEIVER_NAME' },
    { dataField: 'driverName', dataType: 'string', caption: 'CORPORATE.DRIVER_NAME' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 80, allowSorting: false, allowFiltering: false },
  ];

  /** Same single view button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'find', labelKey: 'COMMON.VIEW' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'view') this.onView(e.row);
  }

  ngOnInit(): void {
    this.loadDeliveryNotes();
  }

  loadDeliveryNotes(): void {
    this.loading.set(true);
    this.corporateFleetService.getDeliveryNotes().subscribe({
      next: (notes: any) => {
        this.deliveryNotes.set(notes.data || notes || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.DELIVERIES_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/corporate/deliveries/new']);
  }

  onView = (e: any): void => {
    const id = (e?.row?.data ?? e)?.id;
    this.router.navigate(['/sales/corporate/deliveries/view', id]);
  };

  // --- Mobile card-list rendering ---
  mobileTitleOf = (note: DeliveryNoteResult) => note.deliveryNoteNumber;
  mobileTrackBy = (_index: number, note: DeliveryNoteResult) => note.id;

  mobileFields: MobileCardField<DeliveryNoteResult>[] = [
    { label: 'VIN', value: (note) => note.vin },
    { label: 'CORPORATE.GATE_PASS_SERIAL', value: (note) => note.gatePassSerial },
    { label: 'CORPORATE.DELIVERY_DATE', value: (note) => note.deliveryDate ? new Date(note.deliveryDate).toLocaleDateString() : '' },
    { label: 'CORPORATE.RECEIVER_NAME', value: (note) => note.deliveredToName },
    { label: 'CORPORATE.DRIVER_NAME', value: (note) => note.driverName },
  ];

  mobileView(note: DeliveryNoteResult): void {
    this.onView({ row: { data: { id: note.id } } });
  }
}
