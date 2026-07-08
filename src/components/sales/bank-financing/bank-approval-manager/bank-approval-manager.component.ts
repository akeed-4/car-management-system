import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { PendingBankQuotesDropdownComponent } from './pending-bank-quotes-dropdown/pending-bank-quotes-dropdown.component';
import { LpoVerificationFormComponent, LpoVerificationData } from './lpo-verification-form/lpo-verification-form.component';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { ToastService } from '../../../../services/toast.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';

@Component({
  selector: 'app-bank-approval-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    PendingBankQuotesDropdownComponent,
    LpoVerificationFormComponent
  ],
  templateUrl: './bank-approval-manager.component.html',
  styleUrls: ['./bank-approval-manager.component.css']
})
export class BankApprovalManagerComponent {
  selectedQuotation: BankQuotation | null = null;
  lpoData: LpoVerificationData | null = null;
  submitting = false;

  constructor(
    private bankFinancingService: BankFinancingService,
    private toast: ToastService,
    private router: Router
  ) {}

  onQuotationSelected(quotation: BankQuotation | null): void {
    this.selectedQuotation = quotation;
  }

  onLpoDataChange(lpoData: LpoVerificationData | null): void {
    this.lpoData = lpoData;
  }

  get isFormValid(): boolean {
    return !!this.selectedQuotation && !!this.lpoData;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.selectedQuotation?.id || !this.lpoData) {
      return;
    }

    this.submitting = true;
    this.bankFinancingService
      .createApproval({
        quotationId: this.selectedQuotation.id,
        lpoReference: this.lpoData.lpoReference,
        approvedFinancingAmount: this.lpoData.approvedFinancingAmount,
        approvalDate: this.lpoData.approvalDate
      })
      .subscribe({
        next: approval => {
          this.submitting = false;
          this.toast.showSuccess('BANK_FINANCING.APPROVAL_CREATED');
          this.router.navigate(['/sales/bank-financing/invoices/new'], {
            queryParams: { approvalId: approval.id }
          });
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('BANK_FINANCING.APPROVAL_CREATE_FAILED');
        }
      });
  }
}
