import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyService } from '../../../../services/currency.service';
import { NotificationService } from '../../../../services/notification.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from '../../../../models/currency.model';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-currency-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './currency-form.component.html',
  styleUrls: ['./currency-form.component.css']
})
export class CurrencyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private currencyService = inject(CurrencyService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  mode: FormMode = 'create';
  currencyId: number | null = null;
  isLoading = signal(false);
  isSaving = signal(false);

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(3)]],
      nameAr: ['', [Validators.required, Validators.maxLength(100)]],
      nameEn: ['', [Validators.required, Validators.maxLength(100)]],
      symbol: ['', Validators.maxLength(10)],
      decimalPlaces: [2, [Validators.required, Validators.min(0), Validators.max(4)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    const url = this.route.snapshot.url.map(s => s.path);
    this.mode = url.includes('edit') ? 'edit' : 'create';

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.currencyId = +idParam;
      this.loadCurrency(this.currencyId);
    }
  }

  loadCurrency(id: number): void {
    this.isLoading.set(true);
    this.currencyService.getById(id).subscribe({
      next: (currency) => {
        this.form.patchValue(currency);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError(this.translate.instant('CURRENCY.LOAD_ERROR'));
        this.router.navigate(['/setup/currencies']);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showWarning(this.translate.instant('CURRENCY.VALIDATION_ERROR'));
      return;
    }

    const raw = this.form.getRawValue();
    const dto: CreateCurrencyDto | UpdateCurrencyDto = { ...raw, code: (raw.code || '').toUpperCase() };
    this.isSaving.set(true);

    const onSuccess = () => {
      this.isSaving.set(false);
      this.notificationService.showSuccess(this.translate.instant(this.mode === 'edit' ? 'CURRENCY.UPDATE_SUCCESS' : 'CURRENCY.CREATE_SUCCESS'));
      this.router.navigate(['/setup/currencies']);
    };
    const onError = (err: any) => {
      this.isSaving.set(false);
      const msg = err?.error?.message || err?.error || this.translate.instant('CURRENCY.SAVE_ERROR');
      this.notificationService.showError(msg);
    };

    if (this.mode === 'edit' && this.currencyId) {
      this.currencyService.update(this.currencyId, dto).subscribe({ next: onSuccess, error: onError });
    } else {
      this.currencyService.create(dto).subscribe({ next: onSuccess, error: onError });
    }
  }

  cancel(): void {
    this.router.navigate(['/setup/currencies']);
  }
}
