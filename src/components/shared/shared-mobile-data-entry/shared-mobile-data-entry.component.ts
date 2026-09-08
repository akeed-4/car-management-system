import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MobileHeaderComponent } from '../mobile-header/mobile-header.component';

/**
 * Generic, application-wide mobile Add/Edit screen shell: mobile header (back/title),
 * loading/saving states, a sticky touch-friendly action bar (Save / Save & New /
 * Save & Print / Approve / Cancel), and validation-summary presentation. Purely
 * presentational -- the feature-specific form is projected via <ng-content>, and all
 * business logic (form group, validators, save/approve behavior) stays owned by the
 * calling screen, exactly like SharedDataGridComponent keeps data/permissions with
 * the screen for desktop grids.
 *
 * Composes the existing MobileHeaderComponent for the header; its own sticky footer
 * follows the same markup/CSS contract as the existing (till-now-unused)
 * StickyActionBarComponent but adds the extra Save & New / Save & Print / Approve
 * slots that component didn't have, so screens with a richer action set (not just
 * Save/Cancel) can still use one shared shell.
 */
@Component({
  selector: 'shared-mobile-data-entry',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, MatButtonModule, MatMenuModule, MobileHeaderComponent],
  templateUrl: './shared-mobile-data-entry.component.html',
  styleUrl: './shared-mobile-data-entry.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedMobileDataEntryComponent {
  // ---- Header ---------------------------------------------------------------
  @Input() title = '';
  @Input() showBack = true;
  @Output() back = new EventEmitter<void>();

  // ---- State ------------------------------------------------------------------
  @Input() loading = false;
  @Input() saving = false;
  @Input() isEditMode = false;

  // ---- Action visibility/enablement -----------------------------------------------
  @Input() canSave = true;
  @Input() canSaveAndNew = false;
  @Input() canSaveAndPrint = false;
  @Input() canApprove = false;
  @Input() canCancel = true;

  // ---- Labels (i18n keys; overridable per-screen) -----------------------------------
  @Input() saveLabel = 'COMMON.SAVE';
  @Input() saveAndNewLabel = 'COMMON.SAVE_AND_NEW';
  @Input() saveAndPrintLabel = 'COMMON.SAVE_AND_PRINT';
  @Input() approveLabel = 'COMMON.APPROVE';
  @Input() cancelLabel = 'COMMON.CANCEL';

  // ---- Validation summary --------------------------------------------------------
  /** Optional list of i18n keys/literal messages shown above the action bar. */
  @Input() validationErrors: string[] = [];

  // ---- Outputs ----------------------------------------------------------------------
  @Output() save = new EventEmitter<void>();
  @Output() saveAndNew = new EventEmitter<void>();
  @Output() saveAndPrint = new EventEmitter<void>();
  @Output() approve = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected get primarySaveDisabled(): boolean {
    return !this.canSave || this.saving || this.loading;
  }

  onBack(): void {
    this.back.emit();
  }

  onSave(): void {
    if (!this.primarySaveDisabled) this.save.emit();
  }

  onSaveAndNew(): void {
    if (!this.primarySaveDisabled) this.saveAndNew.emit();
  }

  onSaveAndPrint(): void {
    if (!this.primarySaveDisabled) this.saveAndPrint.emit();
  }

  onApprove(): void {
    if (!this.saving && !this.loading) this.approve.emit();
  }

  onCancel(): void {
    if (!this.saving) this.cancel.emit();
  }
}
