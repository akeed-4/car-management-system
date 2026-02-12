import { Component, OnInit } from '@angular/core';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { CarReceipt } from '../../../models/car-receipt.model';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-car-receipts',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './car-receipts.component.html',
  styleUrls: ['./car-receipts.component.css']
})
export class CarReceiptsComponent implements OnInit {
  carReceipts: CarReceipt[] = [];

  constructor(private purchaseCycleService: PurchaseCycleService) { }

  ngOnInit(): void {
    this.loadCarReceipts();
  }

  loadCarReceipts(): void {
    this.purchaseCycleService.getCarReceipts().subscribe(
      data => this.carReceipts = data,
      error => console.error('Error loading car receipts', error)
    );
  }

  getItemsCount(rowData: CarReceipt): number {
    return rowData.carReceiptItems ? rowData.carReceiptItems.length : 0;
  }
}