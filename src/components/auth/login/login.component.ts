import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { resolveOnboardingDestination } from '../../../models/platform/onboarding-routing.util';
import { resolveCompanySelection } from '../../../models/platform/company-selection-routing.util';
import { login } from './login.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
    TranslateModule,
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  passwordWasReset = false;

  /** Spans the entire login -> membership -> tenant/onboarding chain, not just the login call
   *  itself -- guards against a double-click firing a second full chain while the first is
   *  still resolving its multi-step redirect. */
  loggingIn = signal(false);

  hidePassword = signal(true);

  readonly features: Array<{ icon: string; titleKey: string; descKey: string }> = [
    { icon: 'directions_car', titleKey: 'REGISTRATION.FEATURES.INVENTORY.TITLE', descKey: 'REGISTRATION.FEATURES.INVENTORY.DESC' },
    { icon: 'point_of_sale', titleKey: 'REGISTRATION.FEATURES.SALES.TITLE', descKey: 'REGISTRATION.FEATURES.SALES.DESC' },
    { icon: 'bar_chart', titleKey: 'REGISTRATION.FEATURES.REPORTS.TITLE', descKey: 'REGISTRATION.FEATURES.REPORTS.DESC' },
    { icon: 'store', titleKey: 'REGISTRATION.FEATURES.BRANCHES.TITLE', descKey: 'REGISTRATION.FEATURES.BRANCHES.DESC' },
    { icon: 'translate', titleKey: 'REGISTRATION.FEATURES.LANGUAGES.TITLE', descKey: 'REGISTRATION.FEATURES.LANGUAGES.DESC' },
    { icon: 'lock', titleKey: 'REGISTRATION.FEATURES.SECURITY.TITLE', descKey: 'REGISTRATION.FEATURES.SECURITY.DESC' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
      private translate: TranslateService,
    private authService: AuthService,
    private platformService: PlatformService,
    private tenantContext: TenantContextService
  ) {
    this.loginForm = this.fb.group({
      name: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [true],
    });
    this.passwordWasReset = this.route.snapshot.queryParamMap.get('passwordReset') === '1';
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit(): void {
  if (this.loggingIn()) return;

  if (this.loginForm.valid) {
      const { rememberMe, ...credentials } = this.loginForm.value;
      const login: login = credentials;
      this.errorMessage = null;
      this.loggingIn.set(true);
    this.authService.login(login, rememberMe).subscribe({
      next: () => {
        // subscriptionGuard/tenantGuard (see guards/) attach the originally-requested URL as
        // ?returnUrl=... when they redirect a signed-out or not-yet-onboarded visit here --
        // honor it once we know where the user is actually allowed to land.
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        this.tenantContext.loadMemberships().subscribe({
          next: (memberships) => {
            const outcome = resolveCompanySelection(memberships);

            if (outcome === 'pick') {
              this.loggingIn.set(false);
              this.router.navigate(['/select-company'], { queryParams: returnUrl ? { returnUrl } : undefined });
              return;
            }

            // 'none' -- platform staff / not tied to any tenant, unchanged behavior.
            if (outcome === 'none') {
              this.goToOnboardingDestination(returnUrl);
              return;
            }

            // 'auto' -- exactly one company, select it silently and continue as before.
            this.tenantContext.selectTenant(memberships[0].tenantId, rememberMe).subscribe({
              next: () => this.goToOnboardingDestination(returnUrl),
              error: () => this.goToOnboardingDestination(returnUrl),
            });
          },
          // Fail-open, same rationale as below: don't strand an authenticated user over a
          // transient membership-lookup error.
          error: () => this.goToOnboardingDestination(returnUrl),
        });
      },
      error: (error) => {
        this.loggingIn.set(false);
        this.errorMessage = error?.error?.message || this.translate.instant('LOGIN.INVALID_CREDENTIALS');
      }
    });
  } else {
    this.errorMessage = this.translate.instant('LOGIN.FILL_REQUIRED_FIELDS');
  }
}

  /** Shared tail once a company is resolved (or there was never one to resolve) -- same
   *  status-lookup -> resolveOnboardingDestination() sequence CompanySelectionComponent reuses
   *  for the multi-company path, so the two can't diverge. */
  private goToOnboardingDestination(returnUrl: string | null): void {
    this.platformService.getMySubscriptionStatus().subscribe({
      next: (status) => {
        this.loggingIn.set(false);
        const destination = resolveOnboardingDestination(status, returnUrl);
        this.router.navigate(destination.commands, { queryParams: destination.queryParams });
      },
      // Fail-open: don't strand a user who successfully authenticated just because the
      // subscription-status endpoint errored -- see the guards' own fail-open note.
      error: () => {
        this.loggingIn.set(false);
        this.router.navigateByUrl(returnUrl || '/dashboard');
      },
    });
  }
}
