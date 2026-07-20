import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SalesInvoice } from '../models/sales-invoice.model';
import { PosPaymentStatus } from '../models/pos-payment-status.model';
import { SalesService } from './sales.service';
import { ReceiptService } from './receipt.service';
import { TreasuryService } from './treasury.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentGatewayService {
  private salesService = inject(SalesService);
  private receiptService = inject(ReceiptService);
  private treasuryService = inject(TreasuryService);
  private http = inject(HttpClient);

  // رابط API الخاص ببوابة الدفع
  private paymentApiUrl = environment.origin+'/api/payment-gateway/process-payment';

  async initiatePosPayment(invoice: SalesInvoice): Promise<PosPaymentStatus> {
    try {
      // استدعاء API خارجي لإتمام الدفع
      const response = await firstValueFrom(this.http.post<{ status: PosPaymentStatus }>(
        this.paymentApiUrl,
        {
          invoiceId: invoice.id,
          amount: invoice.amountDue,
          customerId: invoice.customerId,
          paymentMethod: 2,
        }
      ));

      const finalStatus: PosPaymentStatus = response?.status || 'Failed';

      if (finalStatus === 'Success') {
        // 1. Mark the invoice as paid
        this.salesService.applyPayment(invoice.id, invoice.amountDue);

        // 2. Automatically generate a receipt voucher
        const accounts = await firstValueFrom(this.treasuryService.getAccounts());
      const defaultAccount = accounts[0]; // أو أي ح // Assume bank account
        this.receiptService.addReceipt({
          voucherNumber: `RV-POS-${invoice.id}`,
          date: new Date(),
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          referenceId: invoice.id,
          notes: `Receipt for invoice ${invoice.invoiceNumber} paid via POS`,
          createdBy: 1,
          createdAt: new Date(),
          salesInvoiceId: invoice.id,
          amount: invoice.amountDue,
          paymentMethod: 2,
          creditAccountId: defaultAccount.id,
        }).subscribe();
      }

      return finalStatus;
    } catch (error) {
      console.error('Payment API failed:', error);
      return 'Failed';
    }
  }
}
