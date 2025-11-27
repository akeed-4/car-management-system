import { Injectable, signal } from '@angular/core';
import { Receipt } from '../types/receipt.model';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private nextId = signal(3);
  private receipts = signal<Receipt[]>([
    {
      id: 1,
      date: '2024-05-15',
      receiptNumber: 'REC-001',
      customerName: 'أحمد محمد',
      amount: 50000,
      paymentMethod: 'Cash',
      description: 'دفعة مقدمة لشراء سيارة',
      notes: 'تم الاستلام نقداً',
    },
    {
      id: 2,
      date: '2024-05-20',
      receiptNumber: 'REC-002',
      customerName: 'فاطمة علي',
      amount: 120000,
      paymentMethod: 'BankTransfer',
      description: 'دفعة كاملة لسيارة هونداي',
      notes: 'تحويل بنكي',
    },
  ]);

  public receipts$ = this.receipts.asReadonly();

  getReceiptById(id: number): Receipt | undefined {
    return this.receipts().find(r => r.id === id);
  }

  addReceipt(receipt: Omit<Receipt, 'id'>) {
    const newReceipt: Receipt = {
      ...receipt,
      id: this.nextId(),
    };
    this.receipts.update(receipts => [...receipts, newReceipt]);
    this.nextId.update(id => id + 1);
  }

  updateReceipt(updatedReceipt: Receipt) {
    this.receipts.update(receipts =>
      receipts.map(r => (r.id === updatedReceipt.id ? updatedReceipt : r))
    );
  }

  deleteReceipt(id: number) {
    this.receipts.update(receipts => receipts.filter(r => r.id !== id));
  }

  generateReceiptNumber(): string {
    const count = this.receipts().length + 1;
    return `REC-${String(count).padStart(3, '0')}`;
  }
}
