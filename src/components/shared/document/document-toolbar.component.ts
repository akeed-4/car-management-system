import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { PermissionService } from '../../../services/permission.service';
import { DocumentAction } from './document-ui.models';

/**
 * Unified document action toolbar -- ONE implementation shared by every document
 * screen (invoices, orders, quotations, returns, vouchers, inventory documents).
 *
 * Behavior:
 * - Renders the screen-provided DocumentAction[] in order; `primary` actions stay
 *   inline on mobile while everything else collapses into the "More actions" menu.
 * - Actions carrying a `permission` the current role lacks are hidden (same
 *   PermissionService the appHasPermission directive uses).
 * - `busy` disables every action (e.g. while a save-before-print round-trip runs).
 * - RTL/LTR safe: logical CSS properties only.
 */
@Component({
  selector: 'app-document-toolbar',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './document-toolbar.component.html',
  styleUrl: './document-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.Default
})
export class DocumentToolbarComponent {
  /** Screen-provided action list -- rebuilt by the screen whenever its state changes. */
  @Input({ required: true }) actions: DocumentAction[] = [];
  /** Disables every action while a save/print round-trip is in flight. */
  @Input() busy = false;
  /** Optional trailing slot content (e.g. a lifecycle status chip). */
  @Input() showMoreLabel = 'DOCUMENT_COMMON.ACTIONS.MORE_ACTIONS';

  isHandset = false;

  constructor(private breakpointObserver: BreakpointObserver, private permissionService: PermissionService) {
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(result => { this.isHandset = result.matches; });
  }

  /** Actions allowed for the current role and not explicitly hidden. */
  visibleActions(): DocumentAction[] {
    return this.actions.filter(a => a.visible !== false && this.hasPermission(a));
  }

  /** Inline actions: everything on desktop; only primary ones on handset. */
  inlineActions(): DocumentAction[] {
    const visible = this.visibleActions().filter(a => !a.overflow);
    if (!this.isHandset) return visible;
    const primaries = visible.filter(a => a.variant === 'primary');
    // Never leave the toolbar empty on small screens: if no primary action is
    // visible, keep the first one inline so Save is always reachable.
    return primaries.length > 0 ? primaries : visible.slice(0, 1);
  }

  /** Overflow-menu actions: forced-overflow ones always, the rest only on handset. */
  overflowActions(): DocumentAction[] {
    const visible = this.visibleActions();
    const forced = visible.filter(a => a.overflow);
    const collapsed = this.isHandset
      ? visible.filter(a => !a.overflow && a.variant !== 'primary')
      : [];
    // Keep the primary action out of the menu on handset (it stays inline).
    return [...forced, ...collapsed.filter(a => !forced.includes(a))];
  }

  private hasPermission(action: DocumentAction): boolean {
    // No permission requirement -> always shown. Otherwise delegate to the same
    // PermissionService the appHasPermission directive uses, so gating stays
    // consistent with the rest of the app.
    return !action.permission || this.permissionService.hasPermission(action.permission);
  }
}
