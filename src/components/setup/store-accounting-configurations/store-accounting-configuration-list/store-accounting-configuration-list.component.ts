import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { StoreAccountingConfigurationService } from '../../../../services/store-accounting-configuration.service';
import { NotificationService } from '../../../../services/notification.service';
import { StoreAccountingConfiguration } from '../../../../models/store-accounting-configuration.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';

@Component({
  selector: 'app-store-accounting-configuration-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslateModule,
    SharedDataGridComponent,
    HasPermissionDirective
  ],
  templateUrl: './store-accounting-configuration-list.component.html',
  styleUrls: ['./store-accounting-configuration-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreAccountingConfigurationListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private configService = inject(StoreAccountingConfigurationService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);

  configurations = signal<StoreAccountingConfiguration[]>([]);
  loading = signal(false);

  /** Config-driven columns for the Shared DataGrid (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'storeName', dataType: 'string', caption: 'STORE_ACCOUNTING_CONFIG.STORE' },
    { dataField: 'inventoryAccountCode', dataType: 'string', caption: 'STORE_ACCOUNTING_CONFIG.INVENTORY_ACCOUNT', width: 150 },
    { dataField: 'cogsAccountCode', dataType: 'string', caption: 'STORE_ACCOUNTING_CONFIG.COGS_ACCOUNT', width: 150 },
    { dataField: 'inventoryAdjustmentAccountCode', dataType: 'string', caption: 'STORE_ACCOUNTING_CONFIG.ADJUSTMENT_ACCOUNT', width: 180 },
    { dataField: 'isActive', dataType: 'boolean', caption: 'COMMON.ACTIVE', width: 110, type: 'status' },
  ];

  /** Row actions -- same edit/delete behavior via the shared template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('storeaccountingconfig.view') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('storeaccountingconfig.view') },
  ];

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }


  ngOnInit(): void {
    this.loadConfigurations();
  }

  loadConfigurations(): void {
    this.loading.set(true);
    this.configService.getAll().subscribe({
      next: (data) => {
        this.configurations.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('STORE_ACCOUNTING_CONFIG.LOAD_ERROR'));
      }
    });
  }

  refresh(): void {
    this.loadConfigurations();
  }

  onCreate(): void {
    this.router.navigate(['/setup/store-accounting-configurations/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/setup/store-accounting-configurations/edit', e.row.data.id]);
  };

  onDelete = (e: any): void => {
    const config: StoreAccountingConfiguration = e.row.data;
    const message = this.translate.instant('STORE_ACCOUNTING_CONFIG.CONFIRM_DELETE', { store: config.storeName });
    if (!confirm(message)) return;

    this.configService.delete(config.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('STORE_ACCOUNTING_CONFIG.DELETE_SUCCESS'));
        this.loadConfigurations();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('STORE_ACCOUNTING_CONFIG.DELETE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  printGrid(): void {
    window.print();
  }
}
