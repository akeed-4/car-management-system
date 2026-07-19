import { Component, Input, Output, EventEmitter, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

/**
 * Pure UI calculator: Invoice Total / Amount Received / Remaining Change.
 * Purely presentational - does not itself touch AmountPaid/AmountDue/Status on the invoice;
 * the host form reads amountReceived() if it needs to persist it (e.g. as a down payment).
 */
@Component({
  selector: 'app-cash-amount-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './cash-amount-calculator.component.html',
  styleUrl: './cash-amount-calculator.component.css',
})
export class CashAmountCalculatorComponent {
  @Input() set invoiceTotal(value: number) {
    this.invoiceTotalSignal.set(value || 0);
  }
  get invoiceTotal(): number {
    return this.invoiceTotalSignal();
  }

  /** Lets the host pre-fill (e.g. when editing an existing invoice). */
  @Input() set initialAmountReceived(value: number | null | undefined) {
    if (value != null) {
      this.amountReceivedSignal.set(value);
    }
  }

  @Output() amountReceivedChange = new EventEmitter<number>();

  invoiceTotalSignal = signal(0);
  amountReceivedSignal = signal(0);

  constructor() {
    effect(() => {
      this.amountReceivedChange.emit(this.amountReceivedSignal());
    });
  }

  remainingChange = computed(() => {
    const received = this.amountReceivedSignal();
    const total = this.invoiceTotalSignal();
    return received - total;
  });

  /** Positive = change to return to the customer/from the supplier. */
  changeDue = computed(() => Math.max(0, this.remainingChange()));

  /** Positive = still owed toward the invoice total. */
  remainingOwed = computed(() => Math.max(0, -this.remainingChange()));

  isExactMatch = computed(() => this.remainingChange() === 0 && this.invoiceTotalSignal() > 0);

  onAmountReceivedInput(value: string): void {
    const parsed = parseFloat(value);
    // Reject invalid/negative numeric input rather than propagating NaN/negative amounts.
    this.amountReceivedSignal.set(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
  }

  fillExactAmount(): void {
    this.amountReceivedSignal.set(this.invoiceTotalSignal());
  }
}
