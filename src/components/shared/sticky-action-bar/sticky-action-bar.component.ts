import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * Sticky bottom action bar (Cancel | Save) for mobile forms, replacing the
 * in-flow .form-actions row that desktop uses. Purely opt-in: a form's
 * template swaps its normal footer for this component only inside a
 * *ngIf="responsive.isMobile()" branch, so desktop's existing footer and
 * CSS (see customer-form.component.css's .form-actions) is untouched.
 */
@Component({
  selector: 'app-sticky-action-bar',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule],
  templateUrl: './sticky-action-bar.component.html',
  styleUrl: './sticky-action-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyActionBarComponent {
  @Input() saveLabel = 'COMMON.SAVE';
  @Input() cancelLabel = 'COMMON.CANCEL';
  @Input() saveDisabled = false;
  @Input() saving = false;

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onSave(): void {
    if (!this.saveDisabled && !this.saving) {
      this.save.emit();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
