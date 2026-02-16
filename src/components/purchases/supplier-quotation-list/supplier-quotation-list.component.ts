import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';

export interface SupplierQuotation {
  id: number;
  quotationNumber: string;
  linkedPurchaseRequestId: number;
  quotationDate: Date;
  validityPeriod: string;
  currency: string;
  notes: string;
  status: string;
  totalAmount: number;
}

@Component({
  selector: 'app-supplier-quotation-list',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, TranslateModule],
  templateUrl: './supplier-quotation-list.component.html',
  styleUrls: ['./supplier-quotation-list.component.css']
})
export class SupplierQuotationListComponent {
  quotations: SupplierQuotation[] = [
    {
      id: 1,
      quotationNumber: 'SQ-001',
      linkedPurchaseRequestId: 1,
      quotationDate: new Date('2024-01-15'),
      validityPeriod: '30 days',
      currency: 'SAR',
      notes: 'Sample quotation',
      status: 'Draft',
      totalAmount: 150000
    },
    {
      id: 2,
      quotationNumber: 'SQ-002',
      linkedPurchaseRequestId: 2,
      quotationDate: new Date('2024-01-20'),
      validityPeriod: '45 days',
      currency: 'SAR',
      notes: 'Another quotation',
      status: 'Submitted',
      totalAmount: 200000
    }
  ];

  onEdit(quotation: SupplierQuotation) {
    // Navigate to edit form or open modal
    console.log('Edit quotation:', quotation);
  }

  onDelete(quotation: SupplierQuotation) {
    // Delete logic
    console.log('Delete quotation:', quotation);
  }

  onView(quotation: SupplierQuotation) {
    // View details
    console.log('View quotation:', quotation);
  }
}