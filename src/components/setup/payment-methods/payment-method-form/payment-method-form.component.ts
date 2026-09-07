import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentMethodService } from '../../../../services/payment-method.service';
import { NotificationService } from '../../../../services/notification.service';
import { AccountingService } from '../../../accounting/accounting.service';
import { Account } from '../../../accounting/models';
import { AccountAutocompleteComponent } from '../../../shared/account-autocomplete/account-autocomplete.component';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, PAYMENT_METHOD_TYPES } from '../../../../models/payment-method.model';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-payment-method-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    TranslateModule,
    AccountAutocompleteComponent
  ],
  templateUrl: './payment-method-form.component.html',
  styleUrls: ['./payment-method-form.component.css']
})
export class PaymentMethodFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paymentMethodService = inject(PaymentMethodService);
  private accountingService = inject(AccountingService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  mode: FormMode = 'create';
  paymentMethodId: number | null = null;
  isLoading = signal(false);
  isSaving = signal(false);

  paymentTypes = PAYMENT_METHOD_TYPES;
  postableAccounts = signal<Account[]>([]);

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      nameAr: ['', [Validators.required, Validators.maxLength(150)]],
      nameEn: ['', [Validators.required, Validators.maxLength(150)]],
      paymentType: ['', Validators.required],
      accountId: [null, Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.accountingService.getPostableAccounts('cash-bank').subscribe({
      next: (accounts) => this.postableAccounts.set(accounts),
      // Cash/Bank accounts cover the common case; fall back to every postable account so a
      // payment method backed by e.g. a Credit/Receivable account can still be created.
      error: () => this.accountingService.getPostableAccounts().subscribe({
        next: (accounts) => this.postableAccounts.set(accounts),
        error: () => {}
      })
    });

    const url = this.route.snapshot.url.map(s => s.path);
    this.mode = url.includes('edit') ? 'edit' : 'create';

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.paymentMethodId = +idParam;
      this.loadPaymentMethod(this.paymentMethodId);
    }
  }

  loadPaymentMethod(id: number): void {
    this.isLoading.set(true);
    this.paymentMethodService.getById(id).subscribe({
      next: (method) => {
        this.form.patchValue(method);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError(this.translate.instant('PAYMENT_METHOD.LOAD_ERROR'));
        this.router.navigate(['/entities/payment-methods']);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showWarning(this.translate.instant('PAYMENT_METHOD.VALIDATION_ERROR'));
      return;
    }

    const dto: CreatePaymentMethodDto | UpdatePaymentMethodDto = this.form.getRawValue();
    this.isSaving.set(true);

    const onSuccess = () => {
      this.isSaving.set(false);
      this.notificationService.showSuccess(this.translate.instant(this.mode === 'edit' ? 'PAYMENT_METHOD.UPDATE_SUCCESS' : 'PAYMENT_METHOD.CREATE_SUCCESS'));
      this.router.navigate(['/entities/payment-methods']);
    };
    const onError = (err: any) => {
      this.isSaving.set(false);
      const msg = err?.error?.message || err?.error || this.translate.instant('PAYMENT_METHOD.SAVE_ERROR');
      this.notificationService.showError(msg);
    };

    if (this.mode === 'edit' && this.paymentMethodId) {
      this.paymentMethodService.update(this.paymentMethodId, dto).subscribe({ next: onSuccess, error: onError });
    } else {
      this.paymentMethodService.create(dto).subscribe({ next: onSuccess, error: onError });
    }
  }

  cancel(): void {
    this.router.navigate(['/entities/payment-methods']);
  }
}
