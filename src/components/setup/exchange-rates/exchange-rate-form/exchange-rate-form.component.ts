import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { CurrencyService } from '../../../../services/currency.service';
import { ExchangeRateService } from '../../../../services/exchange-rate.service';
import { NotificationService } from '../../../../services/notification.service';
import { Currency } from '../../../../models/currency.model';
import { CreateExchangeRateDto, UpdateExchangeRateDto } from '../../../../models/exchange-rate.model';

type FormMode = 'create' | 'edit';

/** Same-currency guard mirrors the backend rule (ExchangeRateService.ValidateAsync) -- the
 * backend remains the source of truth, this just avoids a round trip for the obvious case. */
const differentCurrenciesValidator: ValidatorFn = (group): ValidationErrors | null => {
  const from = group.get('fromCurrencyId')?.value;
  const to = group.get('toCurrencyId')?.value;
  return from && to && from === to ? { sameCurrency: true } : null;
};

@Component({
  selector: 'app-exchange-rate-form',
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
    TranslateModule
  ],
  templateUrl: './exchange-rate-form.component.html',
  styleUrls: ['./exchange-rate-form.component.css']
})
export class ExchangeRateFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private currencyService = inject(CurrencyService);
  private exchangeRateService = inject(ExchangeRateService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  mode: FormMode = 'create';
  rateId: number | null = null;
  isLoading = signal(false);
  isSaving = signal(false);
  currencies = signal<Currency[]>([]);

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      fromCurrencyId: [null, Validators.required],
      toCurrencyId: [null, Validators.required],
      rate: [null, [Validators.required, Validators.min(0.000001)]],
      effectiveDate: [new Date().toISOString().split('T')[0], Validators.required],
      isActive: [true]
    }, { validators: differentCurrenciesValidator });
  }

  ngOnInit(): void {
    this.loadCurrencies();

    const url = this.route.snapshot.url.map(s => s.path);
    this.mode = url.includes('edit') ? 'edit' : 'create';

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.rateId = +idParam;
      this.loadRate(this.rateId);
      // Editing an existing rate never changes which currencies it links -- see
      // ExchangeRateService.UpdateAsync, which validates against the rate's own From/To.
      this.form.get('fromCurrencyId')?.disable();
      this.form.get('toCurrencyId')?.disable();
    }
  }

  private loadCurrencies(): void {
    this.currencyService.getActive().subscribe({
      next: (data) => this.currencies.set(data || []),
      error: () => this.notificationService.showError(this.translate.instant('EXCHANGE_RATE.LOAD_CURRENCIES_ERROR'))
    });
  }

  loadRate(id: number): void {
    this.isLoading.set(true);
    this.exchangeRateService.getById(id).subscribe({
      next: (rate) => {
        this.form.patchValue({
          ...rate,
          effectiveDate: rate.effectiveDate?.split('T')[0]
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError(this.translate.instant('EXCHANGE_RATE.LOAD_ERROR'));
        this.router.navigate(['/setup/exchange-rates']);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const message = this.form.hasError('sameCurrency')
        ? this.translate.instant('EXCHANGE_RATE.SAME_CURRENCY_ERROR')
        : this.translate.instant('EXCHANGE_RATE.VALIDATION_ERROR');
      this.notificationService.showWarning(message);
      return;
    }

    const raw = this.form.getRawValue();
    this.isSaving.set(true);

    const onSuccess = () => {
      this.isSaving.set(false);
      this.notificationService.showSuccess(this.translate.instant(this.mode === 'edit' ? 'EXCHANGE_RATE.UPDATE_SUCCESS' : 'EXCHANGE_RATE.CREATE_SUCCESS'));
      this.router.navigate(['/setup/exchange-rates']);
    };
    const onError = (err: any) => {
      this.isSaving.set(false);
      const msg = err?.error?.message || err?.error || this.translate.instant('EXCHANGE_RATE.SAVE_ERROR');
      this.notificationService.showError(msg);
    };

    if (this.mode === 'edit' && this.rateId) {
      const dto: UpdateExchangeRateDto = { rate: raw.rate, effectiveDate: raw.effectiveDate, isActive: raw.isActive };
      this.exchangeRateService.update(this.rateId, dto).subscribe({ next: onSuccess, error: onError });
    } else {
      const dto: CreateExchangeRateDto = raw;
      this.exchangeRateService.create(dto).subscribe({ next: onSuccess, error: onError });
    }
  }

  cancel(): void {
    this.router.navigate(['/setup/exchange-rates']);
  }
}
