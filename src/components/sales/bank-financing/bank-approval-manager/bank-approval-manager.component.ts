import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';
import { AttachmentUploaderComponent } from '../../shared/attachment-uploader/attachment-uploader.component';

@Component({
  selector: 'app-bank-approval-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatGridListModule,
    MatChipsModule,
    TranslateModule,
    AttachmentUploaderComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './bank-approval-manager.component.html',
  styleUrls: ['./bank-approval-manager.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankApprovalManagerComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  @ViewChild(AttachmentUploaderComponent) attachmentUploader?: AttachmentUploaderComponent;

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  pendingQuotations = signal<BankQuotation[]>([]);
  selectedQuotation = signal<BankQuotation | null>(null);
  submitting = signal(false);

  approvalForm!: FormGroup;

  ngOnInit(): void {
    this.approvalForm = new FormGroup({
      bankQuotationId: new FormControl(null, Validators.required),
      bankLpoReference: new FormControl('', Validators.required),
      approvedFinancingAmount: new FormControl(0, [Validators.required, Validators.min(0)]),
      downPayment: new FormControl(0, [Validators.min(0)]),
      installmentCount: new FormControl(null, [Validators.min(1)]),
      installmentTermMonths: new FormControl(null, [Validators.min(1)]),
      approvalNotes: new FormControl(''),
      newLockExpiresAt: new FormControl(this.defaultNewExpiry(), Validators.required)
    });

    this.approvalForm.get('bankQuotationId')?.valueChanges.subscribe(id => this.onQuotationSelected(id));

    this.loadPendingQuotations();
  }

  private defaultNewExpiry(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }

  private loadPendingQuotations(): void {
    this.bankFinancingService.getQuotationsByStatus('Locked').subscribe({
      next: quotations => this.pendingQuotations.set(quotations),
      error: () => this.notificationService.showError('BANK_FINANCING.PARTNERS_LOAD_FAILED')
    });
  }

  private onQuotationSelected(id: number | null): void {
    const quotation = this.pendingQuotations().find(q => q.id === id) || null;
    this.selectedQuotation.set(quotation);
    if (quotation) {
      this.approvalForm.patchValue({ approvedFinancingAmount: quotation.vehiclePrice }, { emitEvent: false });
    }
  }

  financedAmount = computed(() => this.approvalForm?.get('approvedFinancingAmount')?.value || 0);
  downPaymentValue = computed(() => this.approvalForm?.get('downPayment')?.value || 0);
  netFinanced = computed(() => Math.max(this.financedAmount() - this.downPaymentValue(), 0));

  get isFormValid(): boolean {
    return this.approvalForm.valid && !!this.selectedQuotation();
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      return;
    }

    const raw = this.approvalForm.getRawValue();
    this.submitting.set(true);

    this.bankFinancingService
      .createApproval({
        bankQuotationId: raw.bankQuotationId,
        bankLpoReference: raw.bankLpoReference,
        approvedFinancingAmount: raw.approvedFinancingAmount,
        downPayment: raw.downPayment || undefined,
        installmentCount: raw.installmentCount || undefined,
        installmentTermMonths: raw.installmentTermMonths || undefined,
        approvalNotes: raw.approvalNotes || undefined,
        newLockExpiresAt: new Date(raw.newLockExpiresAt).toISOString(),
        userId: 1
      })
      .subscribe({
        next: quotation => {
          this.submitting.set(false);
          this.notificationService.showSuccess('BANK_FINANCING.APPROVAL_RECORDED');
          this.router.navigate(['/sales/bank/orders/new'], {
            queryParams: { approvalId: quotation.id }
          });
        },
        error: () => {
          this.submitting.set(false);
          this.notificationService.showError('BANK_FINANCING.APPROVAL_FAILED');
        }
      });
  }
}
