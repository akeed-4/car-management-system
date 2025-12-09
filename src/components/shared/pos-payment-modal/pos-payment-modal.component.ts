import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { PosPaymentStatus } from '../../../types/pos-payment-status.model';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-pos-payment-modal',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './pos-payment-modal.component.html',
  styleUrl: './pos-payment-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosPaymentModalComponent {
  isOpen = input.required<boolean>();
  invoice = input.required<SalesInvoice | null>();
  status = input.required<PosPaymentStatus>();
  
  close = output<void>();

  onClose() {
    // Only allow closing if the transaction is not pending
    if (this.status() !== 'Pending') {
      this.close.emit();
    }
  }
}
