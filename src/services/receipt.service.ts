import { Injectable, signal } from '@angular/core';
import { ReceiptVoucher } from '../types/receipt-voucher.model';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private nextId = signal(1);
  private receipts = signal<ReceiptVoucher[]>([]);

  public receipts$ = this.receipts.asReadonly();

  addReceipt(receipt: Omit<ReceiptVoucher, 'id'>) {
    const newReceipt: ReceiptVoucher = {
      ...receipt,
      id: this.nextId(),
    };
    this.receipts.update(receipts => [...receipts, newReceipt]);
    this.nextId.update(id => id + 1);
  }
}