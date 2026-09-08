/** One configurable field shown in a SharedMobileList card (label/value row). */
export interface MobileListFieldDto<T = any> {
  /** i18n key or plain label shown as the row's small caption. */
  label: string;
  /** Reads the display value out of a row. */
  value: (item: T) => string | number | Date | null | undefined;
  /** Special rendering: 'status' renders an erp-status-badge, 'currency'/'number'/'date'
   *  apply the matching Angular pipe via SharedMobileList's own formatting helpers. */
  type?: 'text' | 'status' | 'currency' | 'number' | 'date';
  /** Status-badge modifier resolver (mirrors dataGridColumnDto.statusClass). Only used
   *  when type === 'status'. Return 'success' | 'warning' | 'danger' | 'neutral'. */
  statusClass?: (item: T) => string;
  /** Format string passed to the underlying pipe (currency code, number digitsInfo, date format). */
  format?: string;
  /** Hide this field's row entirely for a given item (e.g. optional fields). */
  visible?: (item: T) => boolean;
}

/** One row/item action rendered in a SharedMobileList card's action row.
 *  Mirrors sharedGridRowActionDto (grid.model.ts) so screens can typically reuse
 *  the same action list for both the desktop grid and the mobile list. */
export interface MobileListActionDto<T = any> {
  /** Stable id emitted on the `action` output so the screen dispatches business behavior. */
  id: string;
  /** Material icon name shown inside the action button. */
  icon?: string;
  /** i18n key used as the button's label/tooltip/aria-label. */
  labelKey?: string;
  /** Per-item predicate -- return false to hide the action for that item. */
  visible?: (item: T) => boolean;
  /** Optional per-item disable predicate (button rendered but not clickable). */
  disabled?: (item: T) => boolean;
  /** Extra CSS class(es) for the button (e.g. 'btn-danger' for destructive actions). */
  cssClass?: string;
  /** Well-known ids get a default icon/label if the screen omits them. */
}

/** Payload of the SharedMobileList `action` output. */
export interface MobileListActionEvent<T = any> {
  actionId: string;
  item: T;
}

/** One filter control rendered in the SharedMobileList filter panel. Presentation only --
 *  the screen owns filter state and reacts to the `filterChange` output. */
export interface MobileListFilterDto {
  key: string;
  /** i18n key or literal label. */
  label: string;
  type: 'select' | 'text' | 'date' | 'boolean';
  /** Options for type: 'select'. */
  options?: { value: any; label: string }[];
  /** Current value (screen-controlled, so the panel reflects external resets too). */
  value?: any;
}

/** Payload of the SharedMobileList `filterChange` output: the full current filter-value map. */
export type MobileListFilterEvent = Record<string, any>;
