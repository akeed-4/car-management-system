import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { FleetItem } from '../../../../../models/corporate/corporate-quotation.model';

@Component({
  selector: 'app-fleet-item-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    TranslateModule
  ],
  templateUrl: './fleet-item-table.component.html',
  styleUrls: ['./fleet-item-table.component.css']
})
export class FleetItemTableComponent {
  @Output() itemsChange = new EventEmitter<FleetItem[]>();

  items: FleetItem[] = [];
  displayedColumns = ['carModelDescription', 'quantity', 'unitPrice', 'discountRate', 'lineTotal', 'actions'];

  addRow(): void {
    this.items = [
      ...this.items,
      { carModelId: 0, carModelDescription: '', quantity: 1, unitPrice: 0, discountRate: 0, lineTotal: 0 }
    ];
    this.emitChange();
  }

  removeRow(index: number): void {
    this.items = this.items.filter((_, i) => i !== index);
    this.emitChange();
  }

  onRowChange(index: number): void {
    const item = this.items[index];
    const gross = item.quantity * item.unitPrice;
    item.lineTotal = gross - (gross * item.discountRate) / 100;
    this.emitChange();
  }

  private emitChange(): void {
    this.itemsChange.emit(this.items);
  }
}
