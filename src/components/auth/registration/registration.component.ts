import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/AuthService.service';
import { PlatformService } from '../../../services/platform.service';
import { TenantContextService } from '../../../services/tenant-context.service';
import { SelfRegisterTenantDto } from '../../../models/platform/onboarding.model';
import { resolveOnboardingDestination } from '../../../models/platform/onboarding-routing.util';
import { error } from 'console';

/** Purely a visual/UX aid -- the actual submit validator only requires Validators.minLength(6)
 *  (matches the backend's ASP.NET Identity password policy). These extra criteria just drive the
 *  strength meter and checklist so a user is encouraged, not blocked, from choosing a strong
 *  password. */
interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

function passwordsMatchValidator(group: FormGroup): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!confirm) return null;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class RegistrationComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private platformService = inject(PlatformService);
  private tenantContext = inject(TenantContextService);

  registrationForm: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = signal(false);

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  readonly features: Array<{ icon: string; titleKey: string; descKey: string }> = [
    { icon: 'directions_car', titleKey: 'REGISTRATION.FEATURES.INVENTORY.TITLE', descKey: 'REGISTRATION.FEATURES.INVENTORY.DESC' },
    { icon: 'point_of_sale', titleKey: 'REGISTRATION.FEATURES.SALES.TITLE', descKey: 'REGISTRATION.FEATURES.SALES.DESC' },
    { icon: 'bar_chart', titleKey: 'REGISTRATION.FEATURES.REPORTS.TITLE', descKey: 'REGISTRATION.FEATURES.REPORTS.DESC' },
    { icon: 'store', titleKey: 'REGISTRATION.FEATURES.BRANCHES.TITLE', descKey: 'REGISTRATION.FEATURES.BRANCHES.DESC' },
    { icon: 'translate', titleKey: 'REGISTRATION.FEATURES.LANGUAGES.TITLE', descKey: 'REGISTRATION.FEATURES.LANGUAGES.DESC' },
    { icon: 'lock', titleKey: 'REGISTRATION.FEATURES.SECURITY.TITLE', descKey: 'REGISTRATION.FEATURES.SECURITY.DESC' },
  ];

  constructor() {
    this.registrationForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      country: ['', [Validators.required]],
      phone: [''],
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    }, { validators: passwordsMatchValidator });
  }

  // registrationForm.get('password')!.valueChanges isn't itself a signal, so this is
  // re-evaluated on every change-detection pass instead -- cheap enough for a handful of regex
  // tests against one short string, and avoids wiring a toSignal() just for this.
  passwordScore = computed(() => {
    const value: string = this.registrationForm?.get('password')?.value || '';
    if (!value) return 0;
    const c = this.criteriaFor(value);
    return [c.minLength, c.hasUppercase, c.hasLowercase, c.hasNumber, c.hasSpecialChar].filter(Boolean).length;
  });

  private criteriaFor(value: string): PasswordCriteria {
    return {
      minLength: value.length >= 8,
      hasUppercase: /[A-Z]/.test(value),
      hasLowercase: /[a-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
      hasSpecialChar: /[^A-Za-z0-9]/.test(value),
    };
  }

  get passwordValue(): string {
    return this.registrationForm.get('password')?.value || '';
  }

  get criteria(): PasswordCriteria {
    return this.criteriaFor(this.passwordValue);
  }

  get strengthLevel(): PasswordStrengthLevel {
    if (!this.passwordValue) return 'empty';
    const score = this.passwordScore();
    if (score <= 2) return 'weak';
    if (score === 3) return 'fair';
    if (score === 4) return 'good';
    return 'strong';
  }

  get strengthLabelKey(): string {
    return `REGISTRATION.PASSWORD_STRENGTH.${this.strengthLevel.toUpperCase()}`;
  }

  get passwordsMatch(): boolean {
    const confirm = this.registrationForm.get('confirmPassword')?.value;
    return !!confirm && confirm === this.passwordValue;
  }

  get passwordsMismatch(): boolean {
    const confirm = this.registrationForm.get('confirmPassword')?.value;
    return !!confirm && confirm !== this.passwordValue;
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    // Guards against a double-fire (Enter key re-submit, double-click before the button's
    // [disabled] binding visually updates, etc.) creating two tenants from one form submission
    // and racing two overlapping setSession()/navigate() chains against each other -- which is
    // what left the plans screen blank until a manual refresh: the second, "losing" chain's
    // in-flight requests could still resolve after the first chain's navigation had already
    // torn down/rebuilt the destination component.
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage = null;

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      if (this.registrationForm.errors?.['mismatch']) {
        this.errorMessage = this.translate.instant('REGISTRATION.PASSWORD_MISMATCH');
      } else {
        this.errorMessage = this.translate.instant('REGISTRATION.FILL_REQUIRED_FIELDS');
      }
      return;
    }

    const { companyName, fullName, email, password, phone, country } = this.registrationForm.value;
    const dto: SelfRegisterTenantDto = { companyName, fullName, email, password, phone: phone || null, country };

    this.isSubmitting.set(true);
    this.platformService.selfRegisterTenant(dto).subscribe({
      next: (response) => {
        // Auto sign-in: the tenant + admin user were just created server-side, so the login
        // response is honored the same way AuthService.login()'s would be.
        this.authService.setSession(response);
        this.tenantContext.loadMemberships().subscribe({
          next: (memberships) => {
            if (memberships.length > 0) {
              // Persists the freshly-created company as "current" (localStorage + app state)
              // before routing on, so it's already resolved by the time the app shell's guards
              // (companySelectedGuard/tenantGuard/subscriptionGuard) run.
              this.tenantContext.selectTenant(memberships[0].tenantId).subscribe({
                next: () => this.goToOnboardingDestination(),
                error: () => this.goToOnboardingDestination(),
              });
            } else {
              this.goToOnboardingDestination();

            }
          },
          error: (error) => {
            console.log('error loading memberships after registration, proceeding to onboarding destination', error);
            this.goToOnboardingDestination();
          }
        });
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || this.translate.instant('REGISTRATION.REGISTER_ERROR');
        this.isSubmitting.set(false);
        console.log('error loading memberships after registration, proceeding to onboarding destination', error);

        console.log(error)
      },
    });
  }

  /** Same status-lookup -> resolveOnboardingDestination() sequence LoginComponent uses: no active
   *  subscription yet (always true for a brand new signup) -> /onboarding/plans; already active
   *  (e.g. re-registration edge case) -> /dashboard. isSubmitting is cleared right before
   *  navigating (every path, success or fallback) rather than left set until this component is
   *  torn down -- it was previously never reset on the success path at all, so a user who
   *  navigated back to /registration mid-session (e.g. via browser back) would find the form
   *  permanently disabled. */
  private goToOnboardingDestination(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.platformService.getMySubscriptionStatus().subscribe({
      next: (status) => {
        const destination = resolveOnboardingDestination(status, returnUrl);
        this.isSubmitting.set(false);
        this.router.navigate(destination.commands, { queryParams: destination.queryParams });
      },
      error: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/onboarding/plans'], returnUrl ? { queryParams: { returnUrl } } : {});
      },
    });
  }
}
