import { Observable } from 'rxjs';

/**
 * Shared document UI contracts -- the single source of truth for every document
 * screen's toolbar and totals presentation (Sales/Purchase invoices, orders,
 * quotations, returns, vouchers, inventory documents, ...).
 *
 * These are PRESENTATION-ONLY contracts: they never carry business logic.
 * Calculation, validation, permissions and persistence stay in each screen's
 * existing services/forms -- the UI just describes what to show and what to run.
 */

export type DocumentActionVariant = 'primary' | 'accent' | 'basic' | 'danger';

/**
 * One toolbar action on a document screen.
 *
 * - `label` is a translation key (rendered through the `translate` pipe).
 * - `permission` is an optional permission key (e.g. "grn.approve"); when set and
 *   the current role lacks it, the action is hidden entirely.
 * - `variant` controls the visual weight: `primary` (main Save/Issue action,
 *   stays inline even on mobile), `accent` (Save & Print / Preview), `basic`
 *   (secondary), `danger` (destructive -- always routed to the overflow menu).
 * - `overflow: true` forces the action into the "More actions" menu on desktop.
 * - `execute` is the screen-provided handler; the toolbar owns no behavior.
 */
export interface DocumentAction {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  visible?: boolean;
  disabled?: boolean;
  permission?: string;
  variant?: DocumentActionVariant;
  overflow?: boolean;
  execute: () => void;
}

export type DocumentTotalsRowKind = 'default' | 'total' | 'muted' | 'success' | 'danger';

/**
 * One row of the shared totals block. `labelKey`/`hintKey` are translation keys;
 * `label`/`hint` are literal fallbacks. `value` is a pre-formatted string so the
 * component stays dumb -- each screen keeps its own currency/number formatting.
 */
export interface DocumentTotalsRow {
  labelKey?: string;
  label?: string;
  value: string;
  kind?: DocumentTotalsRowKind;
  hintKey?: string;
  hint?: string;
}
