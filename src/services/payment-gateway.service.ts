import { Injectable, inject, signal } from '@angular/core';
import { SalesInvoice } from '../types/sales-invoice.model';
import { PosPaymentStatus } from '../types/pos-payment-status.model';
import { SalesService } from './sales.service';
import { ReceiptService } from './receipt.service';
import { TreasuryService } from './treasury.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentGatewayService {
  private salesService = inject(SalesService);
  private receiptService = inject(ReceiptService);
  private treasuryService = inject(TreasuryService);

  // Simulates a backend state for payment statuses
  private paymentStates = new Map<number, PosPaymentStatus>();

  async initiatePosPayment(invoice: SalesInvoice): Promise<PosPaymentStatus> {
    this.paymentStates.set(invoice.id, 'Pending');

    // Simulate the time it takes for the customer to use the terminal
    await new Promise(resolve => setTimeout(resolve, 8000));

    const isSuccess = Math.random() < 0.8; // 80% success rate
    const finalStatus: PosPaymentStatus = isSuccess ? 'Success' : 'Failed';
    this.paymentStates.set(invoice.id, finalStatus);
    
    if (isSuccess) {
      // 1. Mark the invoice as paid
      this.salesService.applyPayment(invoice.id, invoice.amountDue);

      // 2. Automatically generate a receipt voucher
      const defaultAccount = this.treasuryService.accounts$()[1]; // Assume bank account
      this.receiptService.addReceipt({
        voucherNumber: `RV-POS-${invoice.id}`,
        date: new Date().toISOString().split('T')[0],
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        salesInvoiceId: invoice.id,
        salesInvoiceNumber: invoice.invoiceNumber,
        amount: invoice.amountDue,
        paymentMethod: 'Card',
        accountId: defaultAccount.id,
        accountName: defaultAccount.name,
      });
    }

    return finalStatus;
  }
}
