import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AllocatableInvoice, CreateInvoiceAllocation } from '../../../models/invoice-allocation.model';

/** One row currently in the grid, joining a CreateInvoiceAllocation (what gets sent to the
 *  backend) with the invoice's own number/original balance (for display only). */
export interface InvoiceAllocationRow {
  invoiceId: number;
  invoiceNumber: string;
  originalBalance: number;
  amount: number;
}

/**
 * Shared multi-invoice allocation editor, used by both payment-form (purchase invoices) and
 * receipt-form (sales invoices) so the same add-row/remove-row/distribute/live-balance behavior
 * isn't duplicated per voucher type. A voucher's total may be split across zero or more invoices
 * (an unallocated remainder is a valid advance/standalone portion, never an error by itself) --
 * this component only surfaces the numbers; CreateAsync/UpdateAsync are what actually enforce
 * "allocated total must not exceed voucher total" server-side (see PaymentService/ReceiptService
 * ValidateInvoiceAllocationsAsync), so the same rule is mirrored here only for live UX feedback.
 */
@Component({
  selector: 'app-invoice-allocation-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './invoice-allocation-grid.component.html',
  styleUrl: './invoice-allocation-grid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceAllocationGridComponent {
  /** Every outstanding invoice the caller (customer/supplier) has -- the "add row" dropdown only
   *  offers invoices not already in `rows`. */
  @Input() invoiceOptions: AllocatableInvoice[] = [];
  @Input() totalVoucherAmount = 0;
  @Input() currencyCode = 'SAR';
  @Input() disabled = false;

  private _rows = signal<InvoiceAllocationRow[]>([]);
  @Input()
  set rows(value: InvoiceAllocationRow[] | null | undefined) {
    this._rows.set(value ?? []);
  }
  get rows(): InvoiceAllocationRow[] {
    return this._rows();
  }

  @Output() rowsChange = new EventEmitter<InvoiceAllocationRow[]>();
  /** Emits the plain CreateInvoiceAllocation[] shape the Create/Update DTOs actually need
   *  (invoiceId + amount only) every time rows changes, so a consuming form doesn't have to
   *  re-derive it from InvoiceAllocationRow itself. */
  @Output() allocationsChange = new EventEmitter<CreateInvoiceAllocation[]>();

  selectedInvoiceToAdd: number | null = null;

  totalAllocated = computed(() => this._rows().reduce((sum, r) => sum + (r.amount || 0), 0));
  unallocatedBalance = computed(() => this.totalVoucherAmount - this.totalAllocated());
  /** Only "exceeds" is ever wrong -- leaving part of the voucher unallocated is a valid advance. */
  exceedsTotal = computed(() => this.totalAllocated() > this.totalVoucherAmount + 0.01);

  availableInvoiceOptions = computed(() => {
    const usedIds = new Set(this._rows().map(r => r.invoiceId));
    return this.invoiceOptions.filter(inv => !usedIds.has(inv.invoiceId));
  });

  private emitChange(next: InvoiceAllocationRow[]): void {
    this._rows.set(next);
    this.rowsChange.emit(next);
    this.allocationsChange.emit(next.map(r => ({ invoiceId: r.invoiceId, amount: r.amount })));
  }

  addRow(): void {
    if (this.selectedInvoiceToAdd == null) return;
    const invoice = this.invoiceOptions.find(inv => inv.invoiceId === this.selectedInvoiceToAdd);
    if (!invoice) return;

    this.emitChange([
      ...this._rows(),
      { invoiceId: invoice.invoiceId, invoiceNumber: invoice.invoiceNumber, originalBalance: invoice.amountDue, amount: 0 },
    ]);
    this.selectedInvoiceToAdd = null;
  }

  removeRow(index: number): void {
    const next = this._rows().slice();
    next.splice(index, 1);
    this.emitChange(next);
  }

  onAmountChange(index: number, amount: number): void {
    const next = this._rows().slice();
    next[index] = { ...next[index], amount: amount || 0 };
    this.emitChange(next);
  }

  /** FIFO auto-fill: applies the voucher's full amount across rows in their current (insertion)
   *  order, each capped at its own originalBalance, stopping once the amount runs out -- mirrors
   *  receipt-form.component.ts's pre-existing distributeAmount() so the behavior a user already
   *  knows from receipts carries over unchanged to payments too. */
  distribute(): void {
    let remaining = this.totalVoucherAmount;
    const next = this._rows().map(row => {
      const applied = Math.max(0, Math.min(remaining, row.originalBalance));
      remaining -= applied;
      return { ...row, amount: applied };
    });
    this.emitChange(next);
  }

  trackByInvoiceId(_: number, row: InvoiceAllocationRow): number {
    return row.invoiceId;
  }
}
