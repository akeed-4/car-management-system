import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/AuthService.service';

function passwordsMatchValidator(group: FormGroup): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);

  form: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator });

  errorMessage: string | null = null;
  isSubmitting = signal(false);
  linkInvalid = signal(false);

  private email = '';
  private token = '';

  constructor() {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.email || !this.token) {
      this.linkInvalid.set(true);
    }
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.errors?.['mismatch']) {
        this.errorMessage = this.translate.instant('RESET_PASSWORD.PASSWORD_MISMATCH');
      }
      return;
    }

    this.isSubmitting.set(true);
    this.authService.resetPassword({
      email: this.email,
      token: this.token,
      newPassword: this.form.value.newPassword,
    }).subscribe({
      next: () => {
        this.router.navigate(['/login'], { queryParams: { passwordReset: '1' } });
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || this.translate.instant('RESET_PASSWORD.RESET_ERROR');
        this.isSubmitting.set(false);
      },
    });
  }
}
