import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../../services/bank-financing.service';
import { BankPartner } from '../../../../../models/bank-financing/bank-quotation.model';

@Component({
  selector: 'app-bank-partner-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './bank-partner-dropdown.component.html',
  styleUrls: ['./bank-partner-dropdown.component.css']
})
export class BankPartnerDropdownComponent implements OnInit {
  @Output() bankSelected = new EventEmitter<BankPartner | null>();

  partners: BankPartner[] = [];
  loading = false;
  selectedBankId: number | null = null;

  constructor(private bankFinancingService: BankFinancingService) {}

  ngOnInit(): void {
    this.loading = true;
    this.bankFinancingService.getVerifiedBankPartners().subscribe({
      next: partners => {
        this.partners = partners;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSelectionChange(bankId: number): void {
    const partner = this.partners.find(p => p.id === bankId) ?? null;
    this.bankSelected.emit(partner);
  }
}
