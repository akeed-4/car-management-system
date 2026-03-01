import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerQuotation } from '../../../models/customer-quotation.model';

@Component({
  selector: 'app-customer-quotation-list',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, TranslateModule],
  templateUrl: './customer-quotation-list.component.html',
  styleUrls: ['./customer-quotation-list.component.css']
})
export class CustomerQuotationListComponent {
  quotations: CustomerQuotation[] = [
    {
      id: 1,
      quotationNumber: 'CQ-001',
      customerId: 1,
      quotationDate: '2024-01-15',
      validityPeriod: '30 days',
      currency: 'SAR',
      status: 'Draft',
      items: [],
      totalAmount: 150000
    },
    {
      id: 2,
      quotationNumber: 'CQ-002',
      customerId: 2,
      quotationDate: '2024-01-20',
      validityPeriod: '45 days',
      currency: 'SAR',
      status: 'Submitted',
      items: [],
      totalAmount: 200000
    }
  ];

  onEdit(quotation: CustomerQuotation) {
    // Navigate to edit form or open modal
    console.log('Edit quotation:', quotation);
  }

  onDelete(quotation: CustomerQuotation) {
    // Delete logic
    console.log('Delete quotation:', quotation);
  }

  onView(quotation: CustomerQuotation) {
    // View details
    console.log('View quotation:', quotation);
  }
}