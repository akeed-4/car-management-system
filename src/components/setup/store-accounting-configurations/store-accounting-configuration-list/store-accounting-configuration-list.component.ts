import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreAccountingConfigurationService } from '../../../../services/store-accounting-configuration.service';
import { NotificationService } from '../../../../services/notification.service';
import { StoreAccountingConfiguration } from '../../../../models/store-accounting-configuration.model';

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
    DxDataGridModule,
    DxTemplateModule,
    TranslateModule
  ],
  templateUrl: './store-accounting-configuration-list.component.html',
  styleUrls: ['./store-accounting-configuration-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreAccountingConfigurationListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private configService = inject(StoreAccountingConfigurationService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  configurations = signal<StoreAccountingConfiguration[]>([]);
  loading = signal(false);

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
