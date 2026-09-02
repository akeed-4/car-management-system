/**
 * Permission.Key (e.g. "accounts.chart.view") is the stable authorization identity used by
 * PermissionService.hasPermission and every *Permission="..." directive -- it must never change
 * with the app language. Only the DISPLAY label is localized, via a translation key derived
 * deterministically from Key: dots/dashes -> underscores, upper-cased, under the PERMISSIONS
 * namespace. Mirrors the existing STATUS_<CODE> pattern used for backend-driven enum-like values
 * (see document-status-badge.component.ts) rather than inventing a new i18n mechanism.
 */
export function permissionTranslationKey(key: string): string {
  return 'PERMISSIONS.' + key.toUpperCase().replace(/[.\-]/g, '_');
}
