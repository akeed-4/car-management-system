import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { SplitBillingHeaderComponent } from './split-billing-header/split-billing-header.component';
import { GovRegistrationFormComponent } from './gov-registration-form/gov-registration-form.component';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { ToastService } from '../../../../services/toast.service';
import { SplitBillingSummary, GovRegistrationDetails } from '../../../../models/bank-financing/bank-invoice.model';

@Component({
  selector: 'app-bank-invoice-settlement',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    SplitBillingHeaderComponent,
    GovRegistrationFormComponent
  ],
  templateUrl: './bank-invoice-settlement.component.html',
  styleUrls: ['./bank-invoice-settlement.component.css']
})
export class BankInvoiceSettlementComponent implements OnInit {
  approvalId: number | null = null;
  billing: SplitBillingSummary | null = null;
  registration: GovRegistrationDetails | null = null;
  loading = false;
  submitting = false;

  constructor(
    private bankFinancingService: BankFinancingService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const approvalId = Number(this.route.snapshot.queryParamMap.get('approvalId'));
    if (approvalId) {
      this.approvalId = approvalId;
      this.loadBillingPreview(approvalId);
    }
  }

  private loadBillingPreview(approvalId: number): void {
    this.loading = true;
    this.bankFinancingService.getSplitBillingPreview(approvalId).subscribe({
      next: invoice => {
        this.billing = invoice.billing;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('BANK_FINANCING.BILLING_PREVIEW_LOAD_FAILED');
      }
    });
  }

  onRegistrationChange(registration: GovRegistrationDetails | null): void {
    this.registration = registration;
  }

  get isFormValid(): boolean {
    return !!this.approvalId && !!this.billing && !!this.registration;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.approvalId || !this.registration) {
      return;
    }

    this.submitting = true;
    this.bankFinancingService
      .finalizeInvoice({
        approvalId: this.approvalId,
        registration: this.registration
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.toast.showSuccess('BANK_FINANCING.INVOICE_FINALIZED');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('BANK_FINANCING.INVOICE_FINALIZE_FAILED');
        }
      });
  }
}
