import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-deal-jacket-modal',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './deal-jacket-modal.component.html',
  styleUrl: './deal-jacket-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DealJacketModalComponent {
  isOpen = input.required<boolean>();
  invoice = input.required<SalesInvoice | null>();
  
  close = output<void>();

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
