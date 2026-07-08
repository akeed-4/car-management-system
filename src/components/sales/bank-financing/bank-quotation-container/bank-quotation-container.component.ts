import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { BankPartnerDropdownComponent } from './bank-partner-dropdown/bank-partner-dropdown.component';
import { VinLockTableComponent } from './vin-lock-table/vin-lock-table.component';
import { CustomerInfoFormComponent } from '../../retail/retail-quotation-container/customer-info-form/customer-info-form.component';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { ToastService } from '../../../../services/toast.service';
import { BankPartner, VinLockCandidate } from '../../../../models/bank-financing/bank-quotation.model';
import { RetailCustomerInfo } from '../../../../models/retail/retail-quotation.model';

@Component({
  selector: 'app-bank-quotation-container',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    CustomerInfoFormComponent,
    BankPartnerDropdownComponent,
    VinLockTableComponent
  ],
  templateUrl: './bank-quotation-container.component.html',
  styleUrls: ['./bank-quotation-container.component.css']
})
export class BankQuotationContainerComponent {
  customer: RetailCustomerInfo | null = null;
  selectedBank: BankPartner | null = null;
  selectedVin: VinLockCandidate | null = null;
  submitting = false;

  constructor(
    private bankFinancingService: BankFinancingService,
    private toast: ToastService,
    private router: Router
  ) {}

  onCustomerChange(customer: RetailCustomerInfo | null): void {
    this.customer = customer;
  }

  onBankSelected(bank: BankPartner | null): void {
    this.selectedBank = bank;
  }

  onVinSelected(vin: VinLockCandidate | null): void {
    this.selectedVin = vin;
  }

  get isFormValid(): boolean {
    return !!this.customer && !!this.selectedBank && !!this.selectedVin;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.customer || !this.selectedBank || !this.selectedVin) {
      return;
    }

    this.submitting = true;
    this.bankFinancingService
      .createQuotation({
        quotationDate: new Date().toISOString().split('T')[0],
        customer: this.customer,
        bankId: this.selectedBank.id,
        carId: this.selectedVin.carId,
        vehiclePrice: this.selectedVin.salePrice
      })
      .subscribe({
        next: quotation => {
          this.submitting = false;
          this.toast.showSuccess('BANK_FINANCING.QUOTATION_CREATED');
          this.router.navigate(['/sales/bank-financing/approvals/new'], {
            queryParams: { quotationId: quotation.id }
          });
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('BANK_FINANCING.QUOTATION_CREATE_FAILED');
        }
      });
  }
}
