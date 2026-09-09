import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PermissionService } from '../../../services/permission.service';
import { ResponsiveService } from '../../../services/responsive.service';

/**
 * Standard document-form action bar (Cancel/Back, Save, Save & Print, Print,
 * More). ONE component for both desktop and mobile -- it reads
 * ResponsiveService.isMobile() itself and switches between an inline toolbar
 * (desktop) and a sticky bottom bar (mobile), so calling screens no longer
 * need an `@if (isMobile()) { shared-mobile-data-entry footer } @else {
 * .erp-actions-bar }` split just for their action row.
 *
 * Consolidates three previous implementations:
 * - SharedMobileDataEntryComponent's built-in sticky footer (mobile-only;
 *   still the right choice for a screen that wants the WHOLE header+footer
 *   shell, not just the action row -- this component only replaces the
 *   footer half when used standalone).
 * - The ~59 hand-rolled `.erp-actions-bar` desktop blocks scattered across
 *   forms (deposit-form, receipt-form, customer-form, etc.).
 * - StickyActionBarComponent (Cancel/Save only, 0 usages) -- fully superseded
 *   by this component; safe to delete once nothing references it.
 *
 * Presentational only: no business logic, no save/print/permission decisions.
 * The calling screen owns all of that and reacts to the output events.
 */
@Component({
  selector: 'app-action-bar',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './app-action-bar.component.html',
  styleUrl: './app-action-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppActionBarComponent {
  // ---- Action visibility -----------------------------------------------------------
  @Input() showCancel = true;
  @Input() showSave = true;
  @Input() showSaveAndPrint = false;
  @Input() showPrint = false;
  @Input() showApprove = false;
  @Input() showSaveAndNew = false;

  // ---- Optional permission keys. A blank/undefined key means "always visible" (same
  // convention DocumentToolbarComponent uses for its DocumentAction.permission field) --
  // this deliberately does NOT reuse *appHasPermission directly, since that directive
  // treats an empty string as "hide" rather than "no restriction". ------------------------
  @Input() permissionSave?: string;
  @Input() permissionSaveAndPrint?: string;
  @Input() permissionPrint?: string;
  @Input() permissionApprove?: string;
  @Input() permissionSaveAndNew?: string;
  @Input() permissionCancel?: string;

  // ---- State -------------------------------------------------------------------------
  @Input() saving = false;
  @Input() loading = false;
  /** Disables Save/Save & Print/Save & New beyond the saving/loading state (e.g. invalid form). */
  @Input() saveDisabled = false;
  @Input() printDisabled = false;

  // ---- Labels (i18n keys; overridable per-screen) -------------------------------------
  @Input() cancelLabel = 'COMMON.CANCEL';
  @Input() saveLabel = 'COMMON.SAVE';
  @Input() savingLabel = 'COMMON.SAVING';
  @Input() saveAndPrintLabel = 'COMMON.SAVE_AND_PRINT';
  @Input() printLabel = 'COMMON.PRINT';
  @Input() approveLabel = 'COMMON.APPROVE';
  @Input() saveAndNewLabel = 'COMMON.SAVE_AND_NEW';
  @Input() moreLabel = 'COMMON.MORE_ACTIONS';

  // ---- Outputs -----------------------------------------------------------------------
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() saveAndPrint = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() approve = new EventEmitter<void>();
  @Output() saveAndNew = new EventEmitter<void>();

  constructor(protected responsive: ResponsiveService, private permissionService: PermissionService) {}

  protected get primarySaveDisabled(): boolean {
    return this.saveDisabled || this.saving || this.loading;
  }

  protected get printActionDisabled(): boolean {
    return this.printDisabled || this.saving || this.loading;
  }

  /** Secondary actions (Save & Print, Save & New) collapse into one "More" menu on mobile
   *  to keep the sticky bottom bar from overflowing on narrow screens; desktop shows them
   *  inline since there's room. */
  protected get hasOverflowActions(): boolean {
    return this.canSaveAndPrint || this.canSaveAndNew;
  }

  private allowed(permission?: string): boolean {
    return !permission || this.permissionService.hasPermission(permission);
  }

  protected get canCancel(): boolean { return this.showCancel && this.allowed(this.permissionCancel); }
  protected get canSave(): boolean { return this.showSave && this.allowed(this.permissionSave); }
  protected get canSaveAndPrint(): boolean { return this.showSaveAndPrint && this.allowed(this.permissionSaveAndPrint); }
  protected get canPrint(): boolean { return this.showPrint && this.allowed(this.permissionPrint); }
  protected get canApprove(): boolean { return this.showApprove && this.allowed(this.permissionApprove); }
  protected get canSaveAndNew(): boolean { return this.showSaveAndNew && this.allowed(this.permissionSaveAndNew); }

  onCancel(): void {
    if (!this.saving) this.cancel.emit();
  }

  onSave(): void {
    if (!this.primarySaveDisabled) this.save.emit();
  }

  onSaveAndPrint(): void {
    if (!this.primarySaveDisabled) this.saveAndPrint.emit();
  }

  onPrint(): void {
    if (!this.printActionDisabled) this.print.emit();
  }

  onApprove(): void {
    if (!this.saving && !this.loading) this.approve.emit();
  }

  onSaveAndNew(): void {
    if (!this.primarySaveDisabled) this.saveAndNew.emit();
  }
}
