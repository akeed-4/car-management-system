/**
 * Shared document UI kit barrel.
 *
 * One unified, reference-design-compliant document experience:
 * - DocumentToolbarComponent  -- unified permission-aware action toolbar
 * - DocumentTotalsComponent   -- shared totals block
 * - DocumentPrintService      -- save-before-print workflow (single source of truth)
 * - DocumentAction/DocumentTotalsRow -- presentation-only contracts
 */
export * from './document-ui.models';
export * from './document-toolbar.component';
export * from './document-totals.component';
export * from './document-print.service';
