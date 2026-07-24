import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/AuthService.service';
import { PlatformService } from '../../../services/platform.service';
import { SelfRegisterTenantDto } from '../../../models/platform/onboarding.model';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
})
export class RegistrationComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private platformService = inject(PlatformService);

  registrationForm: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = signal(false);

  constructor() {
    this.registrationForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phone: [''],
      country: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    });
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      this.errorMessage = this.translate.instant('REGISTRATION.FILL_REQUIRED_FIELDS');
      return;
    }

    const { companyName, fullName, email, password, confirmPassword, phone, country } = this.registrationForm.value;
    if (password !== confirmPassword) {
      this.errorMessage = this.translate.instant('REGISTRATION.PASSWORD_MISMATCH');
      return;
    }

    const dto: SelfRegisterTenantDto = { companyName, fullName, email, password, phone: phone || null, country };

    this.isSubmitting.set(true);
    this.platformService.selfRegisterTenant(dto).subscribe({
      next: (response) => {
        // Auto sign-in: the tenant + admin user were just created server-side, so the login
        // response is honored the same way AuthService.login()'s would be.
        this.authService.setSession(response);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigate(['/onboarding/plans'], returnUrl ? { queryParams: { returnUrl } } : {});
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || this.translate.instant('REGISTRATION.REGISTER_ERROR');
        this.isSubmitting.set(false);
      },
    });
  }
}
