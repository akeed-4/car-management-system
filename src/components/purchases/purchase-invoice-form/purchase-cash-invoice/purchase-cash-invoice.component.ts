import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseInvoiceComponent } from '../../purchase-invoice/purchase-invoice.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-purchase-cash-invoice',
  standalone: true,
  imports: [
    CommonModule, 
    PurchaseInvoiceComponent,
    TranslateModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './purchase-cash-invoice.component.html',
  styleUrls: ['./purchase-cash-invoice.component.css']
})
export class PurchaseCashInvoiceComponent implements OnInit {
  @ViewChild(PurchaseInvoiceComponent) purchaseInvoice!: PurchaseInvoiceComponent;
  invoiceTitle: string = '';
  
  constructor(private translateService: TranslateService) {}
  
  ngOnInit(): void {
    this.invoiceTitle = this.translateService.instant('PURCHASE_INVOICE.CASH_INVOICE_TITLE');
    // The payment method locking is now handled by the @Input() properties
    // passed to the <app-purchase-invoice> component in the template
  }
}
