import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QrCodeConfigurationService } from '../../../services/qr-code-configuration.service';
import { QrCodeService } from '../../../services/qr-code.service';
import { NotificationService } from '../../../services/notification.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import {
  QrCodeConfigurationDto,
  CreateQrCodeConfigurationDto,
  QrPosition,
  QR_POSITIONS,
  QR_PLAIN_CONTENT_FIELDS,
  QrCodeContext
} from '../../../models/qr-code.model';

const SAMPLE_CONTEXT: QrCodeContext = {
  companyName: 'معرض سيارات المثال',
  vatNumber: '310123456789013',
  crNumber: '1010123456',
  documentNumber: 'INV-0001',
  documentDate: new Date(),
  customerName: 'عميل تجريبي',
  currency: 'SAR',
  totalBeforeVat: 1000,
  vatAmount: 150,
  grandTotal: 1150
};

@Component({
  selector: 'app-qr-code-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './qr-code-settings.component.html',
  styleUrls: ['./qr-code-settings.component.css']
})
export class QrCodeSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(QrCodeConfigurationService);
  private qrCodeService = inject(QrCodeService);
  private notificationService = inject(NotificationService);
  private currentSettingService = inject(CurrentSettingService);
  private translate = inject(TranslateService);

  positions = QR_POSITIONS;
  plainContentFields = QR_PLAIN_CONTENT_FIELDS;

  isLoading = signal(false);
  existingId: number | null = null;
  previewDataUrl = signal<string | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.load();
  }

  initForm(): void {
    this.form = this.fb.group({
      isEnabled: [true],
      position: ['BottomRight' as QrPosition, Validators.required],
      sizePx: [150, [Validators.required, Validators.min(50), Validators.max(400)]],
      marginPx: [4, [Validators.required, Validators.min(0), Validators.max(40)]],
      caption: [''],
      showBorder: [true],
      borderColor: ['#000000'],
      foregroundColor: ['#000000'],
      zatcaModeEnabled: [true],
      contentFields: [[] as string[]]
    });

    this.form.valueChanges.subscribe(() => this.updatePreview());
  }

  load(): void {
    this.isLoading.set(true);
    const companyId = this.currentSettingService.getCompanyId();
    this.service.getByCompany(companyId).subscribe({
      next: (config) => {
        this.existingId = config.id;
        this.form.patchValue({
          isEnabled: config.isEnabled,
          position: config.position,
          sizePx: config.sizePx,
          marginPx: config.marginPx,
          caption: config.caption ?? '',
          showBorder: config.showBorder,
          borderColor: config.borderColor,
          foregroundColor: config.foregroundColor,
          zatcaModeEnabled: config.zatcaModeEnabled,
          contentFields: this.parseContentFields(config.contentFieldsJson)
        });
        this.isLoading.set(false);
        this.updatePreview();
      },
      error: () => {
        // No configuration exists yet for this company -- form keeps its defaults.
        this.existingId = null;
        this.isLoading.set(false);
        this.updatePreview();
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showWarning(this.translate.instant('QR_CODE_SETTINGS.VALIDATION_ERROR'));
      return;
    }

    const value = this.form.getRawValue();
    const dto: CreateQrCodeConfigurationDto = {
      companyId: this.currentSettingService.getCompanyId(),
      isEnabled: value.isEnabled,
      position: value.position,
      sizePx: value.sizePx,
      marginPx: value.marginPx,
      caption: value.caption || undefined,
      showBorder: value.showBorder,
      borderColor: value.borderColor,
      foregroundColor: value.foregroundColor,
      zatcaModeEnabled: value.zatcaModeEnabled,
      contentFieldsJson: JSON.stringify(value.contentFields ?? [])
    };

    const call$ = this.existingId
      ? this.service.update(this.existingId, dto)
      : this.service.create(dto);

    call$.subscribe({
      next: (saved) => {
        this.existingId = saved.id;
        this.notificationService.showSuccess(this.translate.instant('QR_CODE_SETTINGS.SAVE_SUCCESS'));
      },
      error: (err) => {
        console.error('Error saving QR code configuration', err);
        this.notificationService.showError(this.translate.instant('QR_CODE_SETTINGS.SAVE_ERROR'));
      }
    });
  }

  toggleContentField(field: string, checked: boolean): void {
    const current: string[] = this.form.value.contentFields ?? [];
    const next = checked ? [...current, field] : current.filter(f => f !== field);
    this.form.patchValue({ contentFields: next });
  }

  isContentFieldChecked(field: string): boolean {
    return (this.form.value.contentFields ?? []).includes(field);
  }

  private updatePreview(): void {
    if (!this.form.value.isEnabled) {
      this.previewDataUrl.set(null);
      return;
    }
    const value = this.form.getRawValue();
    const previewConfig: QrCodeConfigurationDto = {
      id: this.existingId ?? 0,
      companyId: this.currentSettingService.getCompanyId(),
      isEnabled: true,
      position: value.position,
      sizePx: value.sizePx,
      marginPx: value.marginPx,
      caption: value.caption,
      showBorder: value.showBorder,
      borderColor: value.borderColor,
      foregroundColor: value.foregroundColor,
      zatcaModeEnabled: value.zatcaModeEnabled,
      contentFieldsJson: JSON.stringify(value.contentFields ?? []),
      createdAt: new Date().toISOString()
    };

    this.qrCodeService.generateQrDataUrl(SAMPLE_CONTEXT, previewConfig)
      .then(url => this.previewDataUrl.set(url))
      .catch(() => this.previewDataUrl.set(null));
  }

  private parseContentFields(json?: string): string[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
