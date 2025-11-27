import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReceiptService } from '../../../services/receipt.service';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.css'
})
export class ReceiptsComponent {
  private receiptService = inject(ReceiptService);
  private router = inject(Router);

  receipts = this.receiptService.receipts$;

  navigateToNewReceipt() {
    this.router.navigate(['/accounts/receipts/new']);
  }

  viewReceipt(id: number) {
    // For now, just navigate to edit
    this.router.navigate(['/accounts/receipts/edit', id]);
  }

  deleteReceipt(id: number) {
    if (confirm('هل أنت متأكد من حذف هذا الإيصال؟')) {
      this.receiptService.deleteReceipt(id);
    }
  }

  getPaymentMethodLabel(method: string): string {
    const methodMap: Record<string, string> = {
      'Cash': 'نقدي',
      'Check': 'شيك',
      'BankTransfer': 'تحويل بنكي',
      'CreditCard': 'بطاقة ائتمان'
    };
    return methodMap[method] || method;
  }

  getTotalReceipts(): number {
    return this.receipts().reduce((sum, receipt) => sum + receipt.amount, 0);
  }
}
