import { Component, OnInit, inject, signal, NgZone } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DocumentNumberingService } from '../../../services/document-numbering.service';
import { NotificationService } from '../../../services/notification.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import {
  DocumentNumberingSettingDto,
  CreateDocumentNumberingSettingDto,
  DocumentNumberFormat,
  DocumentNumberResetCadence,
  DOCUMENT_TYPES
} from '../../../models/document-lifecycle.model';

const FORMATS: DocumentNumberFormat[] = [
  'SequentialOnly', 'DatePlusSequence', 'YearMonthSequence',
  'BranchDateSequence', 'StoreDateSequence', 'FiscalYearSequence'
];

const CADENCES: DocumentNumberResetCadence[] = ['Never', 'Daily', 'Monthly', 'Yearly', 'FiscalYear'];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

@Component({
  selector: 'app-document-numbering-settings',
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
    MatTooltipModule,
    MatProgressSpinnerModule,
    DxDataGridModule,
    DxButtonModule,
    TranslateModule
  ],
  templateUrl: './document-numbering-settings.component.html',
  styleUrls: ['./document-numbering-settings.component.css']
})
export class DocumentNumberingSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(DocumentNumberingService);
  private notificationService = inject(NotificationService);
  private currentSettingService = inject(CurrentSettingService);
  private translate = inject(TranslateService);
  private ngZone = inject(NgZone);
  constructor() {
    this.openEdit = this.openEdit.bind(this);
  }
  documentTypes = DOCUMENT_TYPES;
  formats = FORMATS;
  cadences = CADENCES;
  months = MONTHS;

  settings = signal<DocumentNumberingSettingDto[]>([]);
  isLoading = signal(false);
  editingId: number | null = null;
  showForm = false;

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadSettings();
  }

  initForm(): void {
    this.form = this.fb.group({
      documentType: ['', Validators.required],
      autoNumberingEnabled: [true],
      format: ['SequentialOnly', Validators.required],
      resetCadence: ['Never', Validators.required],
      prefix: [''],
      suffix: [''],
      digitPadding: [4, [Validators.required, Validators.min(1), Validators.max(10)]],
      useDateBasedMaxNumber: [false],
      fiscalYearStartMonth: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
      isActive: [true]
    });
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.service.getAll().subscribe({
      next: (data) => {
        this.settings.set(data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError(this.translate.instant('DOCUMENT_NUMBERING.LOAD_ERROR'));
        this.isLoading.set(false);
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({
      documentType: '',
      autoNumberingEnabled: true,
      format: 'SequentialOnly',
      resetCadence: 'Never',
      prefix: '',
      suffix: '',
      digitPadding: 4,
      useDateBasedMaxNumber: false,
      fiscalYearStartMonth: 1,
      isActive: true
    });
    this.showForm = true;
  }

  openEdit(e: any): void {
    const row: DocumentNumberingSettingDto = e.row.data;
    this.ngZone.run(() => {
      this.editingId = row.id;
      this.form.patchValue(row);
      this.showForm = true;
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showWarning(this.translate.instant('DOCUMENT_NUMBERING.VALIDATION_ERROR'));
      return;
    }

    const value = this.form.getRawValue();
    const dto: CreateDocumentNumberingSettingDto = {
      companyId: this.currentSettingService.getCompanyId() ?? 1,
      documentType: value.documentType,
      autoNumberingEnabled: value.autoNumberingEnabled,
      format: value.format,
      resetCadence: value.resetCadence,
      prefix: value.prefix || undefined,
      suffix: value.suffix || undefined,
      digitPadding: value.digitPadding,
      useDateBasedMaxNumber: value.useDateBasedMaxNumber,
      fiscalYearStartMonth: value.fiscalYearStartMonth,
      isActive: value.isActive
    };

    const call$ = this.editingId
      ? this.service.update(this.editingId, dto)
      : this.service.create(dto);

    call$.subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('DOCUMENT_NUMBERING.SAVE_SUCCESS'));
        this.closeForm();
        this.loadSettings();
      },
      error: (err) => {
        console.error('Error saving document numbering setting', err);
        this.notificationService.showError(this.translate.instant('DOCUMENT_NUMBERING.SAVE_ERROR'));
      }
    });
  }

  delete(e: any): void {
    const row: DocumentNumberingSettingDto = e.row.data;
    this.service.delete(row.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('DOCUMENT_NUMBERING.DELETE_SUCCESS'));
        this.loadSettings();
      },
      error: () => {
        this.notificationService.showError(this.translate.instant('DOCUMENT_NUMBERING.DELETE_ERROR'));
      }
    });
  }

  /** Live client-side preview only -- the real number always comes from the server. */
  get preview(): string {
    if (!this.form) return '';
    const v = this.form.getRawValue();
    const prefix = v.prefix || '';
    const suffix = v.suffix || '';
    const seq = String(1).padStart(v.digitPadding || 4, '0');
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    let middle: string;
    switch (v.format as DocumentNumberFormat) {
      case 'DatePlusSequence':
        middle = `${yyyy}${mm}${dd}-${seq}`;
        break;
      case 'YearMonthSequence':
        middle = `${yyyy}${mm}-${seq}`;
        break;
      case 'BranchDateSequence':
        middle = `BRC-${yyyy}${mm}${dd}-${seq}`;
        break;
      case 'StoreDateSequence':
        middle = `STR-${yyyy}${mm}${dd}-${seq}`;
        break;
      case 'FiscalYearSequence':
        middle = `FY${yyyy}-${seq}`;
        break;
      default:
        middle = seq;
    }

    return `${prefix}${middle}${suffix}`;
  }
}
