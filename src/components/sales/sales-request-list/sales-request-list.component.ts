import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
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
    SharedDataGridComponent,
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

  /** Config-driven columns -- same fields as before (i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'requestNumber', dataType: 'string', caption: 'SALES_REQUEST.REQUEST_NUMBER' },
    { dataField: 'requestDate', dataType: 'date', caption: 'SALES_REQUEST.REQUEST_DATE' },
    { dataField: 'customerName', dataType: 'string', caption: 'SALES_REQUEST.CUSTOMER' },
    { dataField: 'status', dataType: 'string', caption: 'SALES_REQUEST.STATUS' },
    { dataField: 'totalItems', dataType: 'number', caption: 'SALES_REQUEST.TOTAL_ITEMS' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'COMMON.ACTIONS', width: 150, allowSorting: false, allowFiltering: false },
  ];

  /** Same view/edit/delete buttons as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'eye', labelKey: 'COMMON.VIEW' },
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT' },
    { id: 'delete', icon: 'trash', labelKey: 'COMMON.DELETE' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const request = e.row as SalesRequestListItem;
    if (e.actionId === 'view') this.viewRequest(request);
    else if (e.actionId === 'edit') this.editRequest(request);
    else if (e.actionId === 'delete') this.deleteRequest(request);
  }

  ngOnInit(): void {
    // Load data from service
  }

  viewRequest = (request: SalesRequestListItem) => {
    this.router.navigate(['/sales/requests', request.id]);
  };

  editRequest = (request: SalesRequestListItem) => {
    this.router.navigate(['/sales/requests', request.id, 'edit']);
  };

  deleteRequest = (request: SalesRequestListItem) => {
    // Delete logic
    console.log('Delete request', request);
  };

  createNewRequest(): void {
    this.router.navigate(['/sales/requests/new']);
  }
}