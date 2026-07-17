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
import { BankService } from '../../../../services/bank.service';
import { NotificationService } from '../../../../services/notification.service';
import { CreateBankDto, UpdateBankDto } from '../../../../models/bank.model';

type FormMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-bank-management-form',
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
  templateUrl: './bank-form.component.html',
  styleUrls: ['./bank-form.component.css']
})
export class BankManagementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bankService = inject(BankService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  form!: FormGroup;
  mode: FormMode = 'create';
  bankId: number | null = null;
  isLoading = signal(false);
  isSaving = signal(false);

  get isView(): boolean {
    return this.mode === 'view';
  }

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      bankCode: ['', [Validators.required, Validators.maxLength(20)]],
      bankNameEnglish: ['', [Validators.required, Validators.maxLength(150)]],
      bankNameArabic: ['', [Validators.required, Validators.maxLength(150)]],
      swiftCode: ['', Validators.maxLength(20)],
      ibanPrefix: ['', Validators.maxLength(10)],
      country: ['', Validators.maxLength(100)],
      currency: ['', Validators.maxLength(10)],
      notes: ['', Validators.maxLength(1000)],
      address: [''],
      phone: [''],
      email: ['', Validators.email],
      website: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    const url = this.route.snapshot.url.map(s => s.path);
    this.mode = url.includes('view') ? 'view' : url.includes('edit') ? 'edit' : 'create';

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.bankId = +idParam;
      this.loadBank(this.bankId);
    }

    if (this.isView) {
      this.form.disable();
    }
  }

  loadBank(id: number): void {
    this.isLoading.set(true);
    this.bankService.getById(id).subscribe({
      next: (bank) => {
        this.form.patchValue(bank);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError(this.translate.instant('BANK.LOAD_ERROR'));
        this.router.navigate(['/entities/banks']);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showWarning(this.translate.instant('BANK.VALIDATION_ERROR'));
      return;
    }

    const dto: CreateBankDto | UpdateBankDto = this.form.getRawValue();
    this.isSaving.set(true);

    const onSuccess = () => {
      this.isSaving.set(false);
      this.notificationService.showSuccess(this.translate.instant(this.mode === 'edit' ? 'BANK.UPDATE_SUCCESS' : 'BANK.CREATE_SUCCESS'));
      this.router.navigate(['/entities/banks']);
    };
    const onError = (err: any) => {
      this.isSaving.set(false);
      const msg = err?.error?.message || err?.error || this.translate.instant('BANK.SAVE_ERROR');
      this.notificationService.showError(msg);
    };

    if (this.mode === 'edit' && this.bankId) {
      this.bankService.update(this.bankId, dto).subscribe({ next: onSuccess, error: onError });
    } else {
      this.bankService.create(dto).subscribe({ next: onSuccess, error: onError });
    }
  }

  cancel(): void {
    this.router.navigate(['/entities/banks']);
  }

  editFromView(): void {
    if (this.bankId) {
      this.router.navigate(['/entities/banks/edit', this.bankId]);
    }
  }
}
