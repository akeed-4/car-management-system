import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { PurchaseRequest } from '../../../models/purchase-request.model';

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
  purchaseRequests: PurchaseRequest[] = [
    {
      id: 1,
      requestNumber: 'REQ-001',
      requestDate: new Date().toISOString(),
      supplierId: 1,
      supplier: { id: 1, name: 'Supplier A' } as any,
      items: [],
      status: 'Pending'
    },
    {
      id: 2,
      requestNumber: 'REQ-002',
      requestDate: new Date().toISOString(),
      supplierId: 2,
      supplier: { id: 2, name: 'Supplier B' } as any,
      items: [],
      status: 'Approved'
    }
  ];

  addNewRequest(): void {
    console.log('Add new purchase request');
  }
}