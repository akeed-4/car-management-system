import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-purchase-request-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    DxDataGridModule
  ],
  templateUrl: './purchase-request-list.component.html',
  styleUrls: ['./purchase-request-list.component.css']
})
export class PurchaseRequestListComponent {
  purchaseRequests = [
    {
      id: 1,
      requestNumber: 'REQ-001',
      requestDate: new Date(),
      supplier: { name: 'Supplier A' },
      carDescription: 'Car Model A',
      requestedPrice: 15000,
      status: 'Pending'
    },
    {
      id: 2,
      requestNumber: 'REQ-002',
      requestDate: new Date(),
      supplier: { name: 'Supplier B' },
      carDescription: 'Car Model B',
      requestedPrice: 20000,
      status: 'Approved'
    }
  ];

  addNewRequest(): void {
    console.log('Add new purchase request');
  }
}