import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Compact mobile page header: ← Back / Title / Action menu.
 * Renders only inside .mobile-only ancestors or when a screen explicitly
 * swaps its desktop <mat-toolbar>/page-header for this component at
 * <=768px via *ngIf="responsive.isMobile()" — it does not self-hide, so
 * the caller controls exactly where it appears.
 *
 * Actions menu content is projected via <ng-template #mobileHeaderActions>
 * inside the host, picked up through ContentChild since matMenuTriggerFor
 * needs a TemplateRef, not transcluded <ng-content>.
 */
@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './mobile-header.component.html',
  styleUrl: './mobile-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileHeaderComponent {
  @Input() title = '';
  @Input() showBack = true;

  @Output() back = new EventEmitter<void>();

  @ContentChild(TemplateRef) actions?: TemplateRef<unknown>;

  onBack(): void {
    this.back.emit();
  }
}
