import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent {
  private paymentService = inject(PaymentService);
  private router = inject(Router);

  payments = this.paymentService.payments$;

  navigateToNewPayment() {
    this.router.navigate(['/accounts/payments/new']);
  }

  viewPayment(id: number) {
    // For now, just navigate to edit
    this.router.navigate(['/accounts/payments/edit', id]);
  }

  deletePayment(id: number) {
    if (confirm('هل أنت متأكد من حذف هذا السند؟')) {
      this.paymentService.deletePayment(id);
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

  getTotalPayments(): number {
    return this.payments().reduce((sum, payment) => sum + payment.amount, 0);
  }
}
