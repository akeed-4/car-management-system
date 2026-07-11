import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';

export interface ChecklistItem {
  label: string;
  checked: boolean;
}

/**
 * Generic data-driven checklist, modeled after the delivery module's
 * delivery-checklist-modal pattern (item list + toggle) rather than a hardcoded
 * set of form controls (the approach gate-pass-checklist used). Reusable across
 * Corporate/Bank Vehicle Delivery so the checklist items can differ per channel
 * without duplicating component logic.
 */
@Component({
  selector: 'app-document-checklist',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, TranslateModule],
  templateUrl: './document-checklist.component.html',
  styleUrls: ['./document-checklist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentChecklistComponent implements OnChanges {
  @Input() items: ChecklistItem[] = [];
  @Output() itemsChange = new EventEmitter<ChecklistItem[]>();

  currentItems = signal<ChecklistItem[]>([]);
  allChecked = computed(() => this.currentItems().length > 0 && this.currentItems().every(i => i.checked));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.currentItems.set(this.items.map(i => ({ ...i })));
    }
  }

  toggle(index: number): void {
    this.currentItems.update(list =>
      list.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    );
    this.itemsChange.emit(this.currentItems());
  }
}
