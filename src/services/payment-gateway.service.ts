import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private http = inject(HttpClient);

  // رابط API الخاص ببوابة الدفع
  private paymentApiUrl = 'https://api.example.com/payments';

  async initiatePosPayment(invoice: SalesInvoice): Promise<PosPaymentStatus> {
    try {
      // استدعاء API خارجي لإتمام الدفع
      const response = await this.http.post<{ status: PosPaymentStatus }>(
        this.paymentApiUrl,
        {
          invoiceId: invoice.id,
          amount: invoice.amountDue,
          customerId: invoice.customerId,
          paymentMethod: 'Card',
        }
      ).toPromise();

      const finalStatus: PosPaymentStatus = response?.status || 'Failed';

      if (finalStatus === 'Success') {
        // 1. Mark the invoice as paid
        this.salesService.applyPayment(invoice.id, invoice.amountDue);

        // 2. Automatically generate a receipt voucher
        const accounts = await this.treasuryService.getAccounts().toPromise();
      const defaultAccount = accounts[0]; // أو أي ح // Assume bank account
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
    } catch (error) {
      console.error('Payment API failed:', error);
      return 'Failed';
    }
  }
}
