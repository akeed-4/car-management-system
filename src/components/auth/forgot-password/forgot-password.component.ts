import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/AuthService.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  errorMessage: string | null = null;
  isSubmitting = signal(false);
  submitted = signal(false);

  onSubmit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.authService.forgotPassword(this.form.value).subscribe({
      next: () => {
        // Always show the same success state regardless of whether the email exists, so this
        // endpoint can't be used to enumerate registered accounts.
        this.submitted.set(true);
        this.isSubmitting.set(false);
      },
      error: () => {
        this.submitted.set(true);
        this.isSubmitting.set(false);
      },
    });
  }
}
