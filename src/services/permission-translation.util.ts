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

/**
 * Permission.Group (e.g. "Master Data", "Accounts") groups the permissions list into sections on
 * the Roles/Permissions screen. It comes from a small, fixed set of seeded backend strings (see
 * CarManagementDbContext's Permission seed data) -- not user-authored text -- so it's translated
 * the same way as permission labels: a deterministic key under PERMISSIONS.GROUPS, with the raw
 * backend Group string as a fallback for any group not yet translated.
 */
export function permissionGroupTranslationKey(group: string): string {
  return 'PERMISSIONS.GROUPS.' + group.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
