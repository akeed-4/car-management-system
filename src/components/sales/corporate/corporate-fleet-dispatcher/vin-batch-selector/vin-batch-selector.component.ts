import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { RemainingVinCandidate } from '../../../../../models/corporate/corporate-dispatch.model';

@Component({
  selector: 'app-vin-batch-selector',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCheckboxModule, TranslateModule],
  templateUrl: './vin-batch-selector.component.html',
  styleUrls: ['./vin-batch-selector.component.css']
})
export class VinBatchSelectorComponent implements OnChanges {
  @Input() candidates: RemainingVinCandidate[] = [];
  @Output() selectionChange = new EventEmitter<number[]>();

  selectedCarIds = new Set<number>();
  displayedColumns = ['select', 'vin', 'vehicle'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['candidates']) {
      this.selectedCarIds.clear();
      this.emitChange();
    }
  }

  isSelected(carId: number): boolean {
    return this.selectedCarIds.has(carId);
  }

  toggle(carId: number): void {
    if (this.selectedCarIds.has(carId)) {
      this.selectedCarIds.delete(carId);
    } else {
      this.selectedCarIds.add(carId);
    }
    this.emitChange();
  }

  private emitChange(): void {
    this.selectionChange.emit(Array.from(this.selectedCarIds));
  }
}
