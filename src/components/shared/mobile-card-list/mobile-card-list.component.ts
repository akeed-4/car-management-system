import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

/** One field to render as a label/value row inside a card. */
export interface MobileCardField<T> {
  /** i18n key or plain label shown as the row's small caption. */
  label: string;
  /** Reads the display value out of a row. */
  value: (item: T) => string | number | null | undefined;
}

/**
 * Generic card-list renderer that pairs with an existing dx-data-grid: the
 * grid keeps driving data/paging/filtering (still the single source of
 * truth for the dataset), this component only changes how each row is
 * *rendered* on mobile via CSS-only *ngIf="responsive.isMobile()" swaps at
 * the screen level, using the same rows/columns the grid would have shown.
 *
 * A field's rendering is described declaratively (fields[]) so screens
 * don't need a bespoke card template each time; screens that need custom
 * per-row markup can still project one via <ng-template #mobileCardActions>
 * for the actions row (Edit/Delete buttons etc.).
 */
@Component({
  selector: 'app-mobile-card-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ScrollingModule],
  templateUrl: './mobile-card-list.component.html',
  styleUrl: './mobile-card-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileCardListComponent<T = unknown> {
  @Input({ required: true }) items: T[] = [];
  @Input({ required: true }) fields: MobileCardField<T>[] = [];
  /** Reads the card's title (usually the primary/most identifying field). */
  @Input() titleOf: (item: T) => string = () => '';
  @Input() trackByFn: (index: number, item: T) => unknown = (index) => index;
  @Input() emptyMessage = 'COMMON.NO_DATA';
  /** Use CDK virtual scroll for long lists (>~50 items); plain flex list otherwise. */
  @Input() virtualScroll = false;
  @Input() itemSize = 120;

  @Output() itemClick = new EventEmitter<T>();

  @ContentChild(TemplateRef) actionsTemplate?: TemplateRef<{ $implicit: T }>;

  trackByItem = (index: number, item: T) => this.trackByFn(index, item);

  onItemClick(item: T): void {
    this.itemClick.emit(item);
  }
}
