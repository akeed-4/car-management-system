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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { DocumentNumberingService } from '../../../services/document-numbering.service';
import { NotificationService } from '../../../services/notification.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
import { PermissionService } from '../../../services/permission.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
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
    TranslateModule,
    SharedDataGridComponent,
    HasPermissionDirective
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
  private permissionService = inject(PermissionService);
  constructor() {
    this.openEdit = this.openEdit.bind(this);
    this.resetSequence = this.resetSequence.bind(this);
  }

  /** Config-driven columns for the Shared DataGrid (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'documentType', dataType: 'string', caption: 'DOCUMENT_NUMBERING.DOCUMENT_TYPE' },
    { dataField: 'format', dataType: 'string', caption: 'DOCUMENT_NUMBERING.FORMAT' },
    { dataField: 'resetCadence', dataType: 'string', caption: 'DOCUMENT_NUMBERING.RESET_CADENCE' },
    { dataField: 'prefix', dataType: 'string', caption: 'DOCUMENT_NUMBERING.PREFIX' },
    { dataField: 'suffix', dataType: 'string', caption: 'DOCUMENT_NUMBERING.SUFFIX' },
    { dataField: 'digitPadding', dataType: 'number', caption: 'DOCUMENT_NUMBERING.DIGIT_PADDING', width: 100 },
    { dataField: 'startingNumber', dataType: 'number', caption: 'DOCUMENT_NUMBERING.STARTING_NUMBER', width: 100 },
    { dataField: 'currentNumber', dataType: 'number', caption: 'DOCUMENT_NUMBERING.CURRENT_NUMBER', width: 100 },
    { dataField: 'nextNumberPreview', dataType: 'string', caption: 'DOCUMENT_NUMBERING.NEXT_NUMBER' },
    { dataField: 'autoNumberingEnabled', dataType: 'boolean', caption: 'DOCUMENT_NUMBERING.AUTO_ENABLED', width: 110, type: 'check', allowSorting: false },
    { dataField: 'isActive', dataType: 'boolean', caption: 'COMMON.ACTIVE', width: 90, type: 'status', allowSorting: false },
  ];

  /** Row actions -- same edit/reset/delete behavior via the shared template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('settings.documentnumbering.view') },
    { id: 'resetSequence', icon: 'revert', labelKey: 'DOCUMENT_NUMBERING.RESET_SEQUENCE', visible: () => this.permissionService.hasPermission('settings.documentnumbering.view') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('settings.documentnumbering.view') },
  ];

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.openEdit(wrapped);
    else if (e.actionId === 'resetSequence') this.resetSequence(wrapped);
    else if (e.actionId === 'delete') this.delete(wrapped);
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
      startingNumber: [1, [Validators.required, Validators.min(1)]],
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
      startingNumber: 1,
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
      startingNumber: value.startingNumber,
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

  /** Administrator-only: resets the sequence counter back to zero so the next number issued
   * starts at startingNumber again. Requires explicit confirmation since it's not reversible. */
  resetSequence(e: any): void {
    const row: DocumentNumberingSettingDto = e.row.data;
    const confirmed = confirm(this.translate.instant('DOCUMENT_NUMBERING.RESET_SEQUENCE_CONFIRM', { type: row.documentType }));
    if (!confirmed) return;

    this.service.resetSequence(row.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('DOCUMENT_NUMBERING.RESET_SEQUENCE_SUCCESS'));
        this.loadSettings();
      },
      error: () => {
        this.notificationService.showError(this.translate.instant('DOCUMENT_NUMBERING.RESET_SEQUENCE_ERROR'));
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

  /** Current LastNumber for the setting being edited (0 if nothing generated yet this bucket). */
  currentNumberForEditing(): number {
    if (this.editingId == null) return 0;
    return this.settings().find(s => s.id === this.editingId)?.currentNumber ?? 0;
  }

  /** While editing an existing setting, shows the real server-computed next number (reflects the
   * actual current sequence). For a brand-new, unsaved setting there is no sequence row yet, so
   * this falls back to a client-side estimate using startingNumber -- purely illustrative until
   * the first save, at which point loadSettings() will refresh it with the real value. */
  get preview(): string {
    if (!this.form) return '';
    if (this.editingId != null) {
      const row = this.settings().find(s => s.id === this.editingId);
      if (row?.nextNumberPreview) return row.nextNumberPreview;
    }

    const v = this.form.getRawValue();
    const prefix = v.prefix || '';
    const suffix = v.suffix || '';
    const seq = String(v.startingNumber || 1).padStart(v.digitPadding || 4, '0');
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
