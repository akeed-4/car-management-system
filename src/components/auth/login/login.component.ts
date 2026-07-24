import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
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
      FormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatButtonModule,
      MatIconModule,
      MatCardModule,
      MatGridListModule,
      MatTableModule,
      MatDatepickerModule,
      MatDividerModule,
      DxDataGridModule,
      RouterLink,
      TranslateModule,]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  passwordWasReset = false;

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

 onSubmit(): void {
  if (this.loginForm.valid) {
      const { rememberMe, ...credentials } = this.loginForm.value;
      const login: login = credentials;
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
        const destination = resolveOnboardingDestination(status, returnUrl);
        this.router.navigate(destination.commands, { queryParams: destination.queryParams });
      },
      // Fail-open: don't strand a user who successfully authenticated just because the
      // subscription-status endpoint errored -- see the guards' own fail-open note.
      error: () => this.router.navigateByUrl(returnUrl || '/dashboard'),
    });
  }
}
