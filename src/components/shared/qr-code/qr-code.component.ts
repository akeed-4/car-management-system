import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { QrCodeService } from '../../../services/qr-code.service';
import { QrCodeConfigurationService } from '../../../services/qr-code-configuration.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { QrCodeConfigurationDto, QrCodeContext } from '../../../models/qr-code.model';

/**
 * Generic, reusable QR code renderer for any printable document. The caller supplies only a
 * QrCodeContext (company/document/customer/totals data already available to it); this component
 * fetches the current company's QrCodeConfiguration itself and handles payload building +
 * rendering via QrCodeService, so no per-caller wiring or document-specific logic is needed.
 * Has zero knowledge of which document type it's rendering inside.
 */
@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrCodeComponent implements OnChanges {
  @Input({ required: true }) context!: QrCodeContext;
  /** Optional override -- if not provided, the component loads the current company's config itself. */
  @Input() config?: QrCodeConfigurationDto;

  dataUrl = signal<string | null>(null);
  resolvedConfig = signal<QrCodeConfigurationDto | null>(null);
  loading = signal(true);

  constructor(
    private qrCodeService: QrCodeService,
    private qrCodeConfigurationService: QrCodeConfigurationService,
    private currentSettingService: CurrentSettingService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['context'] || changes['config']) {
      this.render();
    }
  }

  private render(): void {
    if (!this.context) return;
    this.loading.set(true);

    const config$ = this.config
      ? Promise.resolve(this.config)
      : firstValueFrom(this.qrCodeConfigurationService.getByCompany(this.currentSettingService.getCompanyId()));

    config$
      .then((config) => {
        if (!config || !config.isEnabled) {
          this.resolvedConfig.set(null);
          this.dataUrl.set(null);
          this.loading.set(false);
          return;
        }
        this.resolvedConfig.set(config);
        return this.qrCodeService.generateQrDataUrl(this.context, config).then((url) => {
          this.dataUrl.set(url);
          this.loading.set(false);
        });
      })
      .catch(() => {
        this.resolvedConfig.set(null);
        this.dataUrl.set(null);
        this.loading.set(false);
      });
  }
}
