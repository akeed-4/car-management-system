import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SalesRequest } from '../../../models/sales-request.model';

interface SalesRequestListItem {
  id: number;
  requestNumber: string;
  requestDate: Date;
  customerName: string;
  status: string;
  totalItems: number;
}

@Component({
  selector: 'app-sales-request-list',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './sales-request-list.component.html',
  styleUrls: ['./sales-request-list.component.css']
})
export class SalesRequestListComponent implements OnInit {
  dataSource: SalesRequestListItem[] = [
    // Sample data
    {
      id: 1,
      requestNumber: 'SR001',
      requestDate: new Date(),
      customerName: 'Customer A',
      status: 'Pending',
      totalItems: 5
    },
    {
      id: 2,
      requestNumber: 'SR002',
      requestDate: new Date(),
      customerName: 'Customer B',
      status: 'Approved',
      totalItems: 3
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load data from service
  }

  viewRequest = (e: any) => {
    this.router.navigate(['/sales/requests', e.row.data.id]);
  };

  editRequest = (e: any) => {
    this.router.navigate(['/sales/requests', e.row.data.id, 'edit']);
  };

  deleteRequest = (e: any) => {
    // Delete logic
    console.log('Delete request', e.row.data);
  };

  createNewRequest(): void {
    this.router.navigate(['/sales/requests/new']);
  }
}