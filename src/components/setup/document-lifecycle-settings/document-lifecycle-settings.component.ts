import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentLifecycleService } from '../../../services/document-lifecycle.service';
import { NotificationService } from '../../../services/notification.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { DocumentLifecycleSettingDto, DOCUMENT_TYPES } from '../../../models/document-lifecycle.model';

interface LifecycleRow {
  documentType: string;
  labelKey: string;
  settingId: number | null;
  autoApproveOnSave: boolean;
  saving: boolean;
}

/** Global admin screen for AutoApproveOnSave per document type -- one row per DOCUMENT_TYPES entry. */
@Component({
  selector: 'app-document-lifecycle-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './document-lifecycle-settings.component.html',
  styleUrls: ['./document-lifecycle-settings.component.css']
})
export class DocumentLifecycleSettingsComponent implements OnInit {
  private service = inject(DocumentLifecycleService);
  private notificationService = inject(NotificationService);
  private currentSettingService = inject(CurrentSettingService);
  private translate = inject(TranslateService);

  rows = signal<LifecycleRow[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.service.getAll().subscribe({
      next: (settings) => {
        const companyId = this.currentSettingService.getCompanyId();
        const byType = new Map<string, DocumentLifecycleSettingDto>(
          (settings ?? []).filter(s => s.companyId === companyId).map(s => [s.documentType, s])
        );

        this.rows.set(DOCUMENT_TYPES.map(t => {
          const existing = byType.get(t.value);
          return {
            documentType: t.value,
            labelKey: t.labelKey,
            settingId: existing?.id ?? null,
            autoApproveOnSave: existing?.autoApproveOnSave ?? false,
            saving: false
          };
        }));
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError(this.translate.instant('DOCUMENT_LIFECYCLE_SETTINGS.LOAD_ERROR'));
        this.isLoading.set(false);
      }
    });
  }

  toggle(row: LifecycleRow, checked: boolean): void {
    row.saving = true;
    const companyId = this.currentSettingService.getCompanyId();

    const call$ = row.settingId
      ? this.service.update(row.settingId, { companyId, documentType: row.documentType, autoApproveOnSave: checked })
      : this.service.create({ companyId, documentType: row.documentType, autoApproveOnSave: checked });

    call$.subscribe({
      next: (saved) => {
        row.autoApproveOnSave = saved.autoApproveOnSave;
        row.settingId = saved.id;
        row.saving = false;
        this.notificationService.showSuccess(this.translate.instant('DOCUMENT_LIFECYCLE_SETTINGS.SAVE_SUCCESS'));
      },
      error: () => {
        row.saving = false;
        this.notificationService.showError(this.translate.instant('DOCUMENT_LIFECYCLE_SETTINGS.SAVE_ERROR'));
      }
    });
  }
}
