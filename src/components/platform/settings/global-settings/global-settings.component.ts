import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { GlobalSettingDto, GlobalSettingsFormValue } from '../../../../models/platform/global-setting.model';

/** Maps each GlobalSettingsFormValue field to the GlobalSetting.Key row it is persisted as --
 *  the backend stores generic key/value pairs, this is the single place that translates between
 *  the two shapes so no other code needs to know the raw key strings. */
const SETTING_KEYS: Record<keyof GlobalSettingsFormValue, string> = {
  applicationName: 'ApplicationName',
  logoUrl: 'LogoUrl',
  smtpHost: 'Smtp.Host',
  smtpPort: 'Smtp.Port',
  smtpUsername: 'Smtp.Username',
  smtpPassword: 'Smtp.Password',
  smtpUseSsl: 'Smtp.UseSsl',
  storageProvider: 'Storage.Provider',
  storageBasePath: 'Storage.BasePath',
  tapSecretKey: 'TapPayments.SecretKey',
  tapPublishableKey: 'TapPayments.PublishableKey',
  tapMerchantId: 'TapPayments.MerchantId',
  defaultCurrency: 'Billing.DefaultCurrency',
  defaultTrialDays: 'Trial.DefaultDays',
  gracePeriodDays: 'Subscription.GracePeriodDays',
  allowTenantHeaderResolution: 'TenantResolution.AllowHeader',
};

@Component({
  selector: 'app-global-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './global-settings.component.html',
  styleUrl: './global-settings.component.css',
})
export class GlobalSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  settingsForm!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    this.settingsForm = this.fb.group({
      applicationName: ['', Validators.required],
      logoUrl: [''],
      smtpHost: [''],
      smtpPort: [587],
      smtpUsername: [''],
      smtpPassword: [''],
      smtpUseSsl: [true],
      storageProvider: ['Local'],
      storageBasePath: [''],
      tapSecretKey: [''],
      tapPublishableKey: [''],
      tapMerchantId: [''],
      defaultCurrency: ['SAR', Validators.required],
      defaultTrialDays: [14, [Validators.required, Validators.min(0)]],
      gracePeriodDays: [7, [Validators.required, Validators.min(0)]],
      allowTenantHeaderResolution: [false],
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.isLoading.set(true);
    this.platformService.getSettings().subscribe({
      next: (settings) => {
        this.populateForm(settings);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('TOAST.LOAD_ERROR');
        this.isLoading.set(false);
      },
    });
  }

  private populateForm(settings: GlobalSettingDto[]): void {
    const byKey = new Map(settings.map(s => [s.key, s.value]));
    const patch: Partial<GlobalSettingsFormValue> = {};
    (Object.keys(SETTING_KEYS) as (keyof GlobalSettingsFormValue)[]).forEach((field) => {
      const raw = byKey.get(SETTING_KEYS[field]);
      if (raw === undefined) return;
      const control = this.settingsForm.get(field);
      if (typeof control?.value === 'boolean') {
        (patch as Record<string, unknown>)[field] = raw === 'true';
      } else if (typeof control?.value === 'number') {
        (patch as Record<string, unknown>)[field] = Number(raw);
      } else {
        (patch as Record<string, unknown>)[field] = raw;
      }
    });
    this.settingsForm.patchValue(patch);
  }

  onSubmit(): void {
    if (this.settingsForm.invalid) {
      this.notificationService.showWarning('TOAST.VALIDATION_ERROR');
      return;
    }

    const value: GlobalSettingsFormValue = this.settingsForm.value;
    const rows: GlobalSettingDto[] = (Object.keys(SETTING_KEYS) as (keyof GlobalSettingsFormValue)[]).map((field) => ({
      key: SETTING_KEYS[field],
      value: String(value[field] ?? ''),
    }));

    this.isSaving.set(true);
    this.platformService.updateSettings(rows).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('TOAST.EDIT_SUCCESS'));
        this.isSaving.set(false);
      },
      error: () => {
        this.notificationService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        this.isSaving.set(false);
      },
    });
  }
}
