import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../../services/bank-financing.service';
import { BankQuotation } from '../../../../../models/bank-financing/bank-quotation.model';

@Component({
  selector: 'app-pending-bank-quotes-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './pending-bank-quotes-dropdown.component.html',
  styleUrls: ['./pending-bank-quotes-dropdown.component.css']
})
export class PendingBankQuotesDropdownComponent implements OnInit {
  @Output() quotationSelected = new EventEmitter<BankQuotation | null>();

  quotations: BankQuotation[] = [];
  loading = false;
  selectedQuotationId: number | null = null;

  constructor(private bankFinancingService: BankFinancingService) {}

  ngOnInit(): void {
    this.loading = true;
    this.bankFinancingService.getPendingBankQuotes().subscribe({
      next: quotations => {
        this.quotations = quotations;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSelectionChange(quotationId: number): void {
    const quotation = this.quotations.find(q => q.id === quotationId) ?? null;
    this.quotationSelected.emit(quotation);
  }
}
