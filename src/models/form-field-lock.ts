import { AbstractControl } from '@angular/forms';

/**
 * Generic UI-state helper for "this field has exactly one valid value right now" scenarios --
 * Payment Method, Invoice Status, Approval Status, Document Type, Currency, Branch, Warehouse,
 * or any other field a caller wants to fix and disable/hide based on its own business rule.
 *
 * Deliberately carries no business logic of its own: callers decide what value to lock to and
 * when (Cash vs Credit, etc.) -- this only executes the lock/unlock mechanics on a given control.
 */
export interface FieldLockConfig<T> {
  /** Value to set on the control while locked. */
  value: T;
  /** Whether the control should also be disabled (kept in the form, submitted via getRawValue()
   * but not user-editable) or left enabled (caller manages visibility itself, e.g. *ngIf). */
  disable: boolean;
}

/**
 * Applies or clears a lock on a single control. Pass `null` to unlock (re-enables the control;
 * does not touch its current value). Pass a config to lock: sets the value, then disables the
 * control if `disable` is true.
 */
export function applyFieldLock<T>(control: AbstractControl | null | undefined, config: FieldLockConfig<T> | null): void {
  if (!control) {
    return;
  }
  if (!config) {
    control.enable({ emitEvent: false });
    return;
  }
  control.setValue(config.value, { emitEvent: false });
  if (config.disable) {
    control.disable({ emitEvent: false });
  } else {
    control.enable({ emitEvent: false });
  }
}
