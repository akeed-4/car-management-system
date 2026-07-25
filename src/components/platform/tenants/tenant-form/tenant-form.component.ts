import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { CreateTenantDto, TenantDto } from '../../../../models/platform/tenant.model';
import { TenantMembershipDto } from '../../../../models/platform/tenant-membership.model';
import { SubscriptionPlanDto } from '../../../../models/platform/subscription-plan.model';
import { DomainDto } from '../../../../models/platform/domain.model';
import { TenantStatus, TenantStatusHelper } from '../../../../models/enums/platform.enums';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatIconModule,
    MatChipsModule,
    TranslateModule,
  ],
  templateUrl: './tenant-form.component.html',
  styleUrl: './tenant-form.component.css',
})
export class TenantFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  protected translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tenantForm!: FormGroup;
  isEdit = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  tenantId = signal<number | null>(null);

  plans = signal<SubscriptionPlanDto[]>([]);
  domains = signal<DomainDto[]>([]);
  newDomainName = signal('');

  // "Grant Access": the only way to add an existing user to a second company -- self-registration
  // rejects any already-registered email, and creating a tenant here never creates/links a User.
  grantAccessEmail = signal('');
  isGrantingAccess = signal(false);

  readonly statusOptions = TenantStatusHelper.getAll();

  selectedPlan = computed(() => {
    const planId = this.tenantForm?.value?.planId;
    return this.plans().find(p => p.id === planId) ?? null;
  });

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    this.tenantForm = this.fb.group({
      code: [{ value: '', disabled: true }],
      name: ['', Validators.required],
      companyLegalName: ['', Validators.required],
      adminFullName: ['', Validators.required],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminPassword: ['', Validators.required],
      phone: [''],
      address: [''],
      country: [''],
      currency: ['SAR'],
      timezone: ['Asia/Riyadh'],
      language: ['ar'],
      logoUrl: [''],
      status: [TenantStatus.Provisioning],
      planId: [null, Validators.required],
      trialEndsAt: [null],
      isActive: [true],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadPlans();

    const routeId = this.route.snapshot.params['id'];
    if (routeId) {
      this.isEdit.set(true);
      this.tenantId.set(+routeId);
      this.tenantForm.get('adminPassword')?.clearValidators();
      this.tenantForm.get('adminPassword')?.updateValueAndValidity();
      this.loadTenant(+routeId);
    }
  }

  private loadPlans(): void {
    this.platformService.getPlans().subscribe({
      next: (plans) => this.plans.set(plans.filter(p => p.isActive)),
      error: () => this.notificationService.showError('TOAST.LOAD_ERROR'),
    });
  }

  private loadTenant(id: number): void {
    this.isLoading.set(true);
    this.platformService.getTenantById(id).subscribe({
      next: (tenant) => {
        this.populateForm(tenant);
        this.loadDomains(id);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('TOAST.LOAD_ERROR');
        this.isLoading.set(false);
        this.router.navigate(['/platform/companies']);
      },
    });
  }

  private loadDomains(tenantId: number): void {
    this.platformService.getDomains().subscribe({
      next: (domains) => this.domains.set(domains.filter(d => d.tenantId === tenantId)),
    });
  }

  private populateForm(tenant: TenantDto): void {
    this.tenantForm.patchValue({
      code: tenant.code,
      name: tenant.name,
      companyLegalName: tenant.companyLegalName,
      adminFullName: tenant.adminFullName,
      adminEmail: tenant.adminEmail,
      phone: tenant.phone,
      address: tenant.address,
      country: tenant.country,
      currency: tenant.currency,
      timezone: tenant.timezone,
      language: tenant.language,
      logoUrl: tenant.logoUrl,
      status: tenant.status,
      planId: tenant.planId,
      trialEndsAt: tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null,
      isActive: tenant.isActive,
      notes: tenant.notes,
    });
  }

  addDomain(): void {
    const name = this.newDomainName().trim();
    if (!name) return;
    // Domain creation has no dedicated backend endpoint yet (only GET /api/platform/domains is
    // specified) -- shown locally as a pending row until that endpoint exists.
    this.domains.update(list => [...list, {
      id: 0,
      tenantId: this.tenantId() ?? 0,
      tenantName: this.tenantForm.value.name,
      domainName: name,
      isVerified: false,
      hasSsl: false,
      createdAt: new Date().toISOString(),
    }]);
    this.newDomainName.set('');
  }

  removeDomain(domainName: string): void {
    this.domains.update(list => list.filter(d => d.domainName !== domainName));
  }

  grantAccess(): void {
    const email = this.grantAccessEmail().trim();
    const id = this.tenantId();
    if (!email || !id) return;

    this.isGrantingAccess.set(true);
    this.platformService.addTenantMember(id, { email, role: 'Member' }).subscribe({
      next: (membership: TenantMembershipDto) => {
        this.notificationService.showSuccess(
          this.translate.instant('PLATFORM.TENANTS.GRANT_ACCESS_SUCCESS', { email, company: membership.tenantName }));
        this.grantAccessEmail.set('');
        this.isGrantingAccess.set(false);
      },
      error: (error) => {
        this.notificationService.showError(error?.error?.message || this.translate.instant('TOAST.SAVE_ERROR'));
        this.isGrantingAccess.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.tenantForm.invalid) {
      this.notificationService.showWarning('TOAST.VALIDATION_ERROR');
      return;
    }

    const formValue = this.tenantForm.getRawValue();
    this.isSaving.set(true);

    if (this.isEdit() && this.tenantId()) {
      const dto = {
        name: formValue.name,
        companyLegalName: formValue.companyLegalName,
        adminFullName: formValue.adminFullName,
        adminEmail: formValue.adminEmail,
        phone: formValue.phone,
        address: formValue.address,
        country: formValue.country,
        currency: formValue.currency,
        timezone: formValue.timezone,
        language: formValue.language,
        logoUrl: formValue.logoUrl,
        status: formValue.status,
        planId: formValue.planId,
        isActive: formValue.isActive,
        notes: formValue.notes,
      };
      this.platformService.updateTenant(this.tenantId()!, dto).subscribe({
        next: () => {
          this.notificationService.showSuccess(this.translate.instant('TOAST.EDIT_SUCCESS'));
          this.isSaving.set(false);
          this.router.navigate(['/platform/companies']);
        },
        error: () => {
          this.notificationService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
          this.isSaving.set(false);
        },
      });
    } else {
      const dto: CreateTenantDto = {
        name: formValue.name,
        subdomain: this.slugify(formValue.name),
        companyLegalName: formValue.companyLegalName,
        adminFullName: formValue.adminFullName,
        adminEmail: formValue.adminEmail,
        adminPassword: formValue.adminPassword,
        phone: formValue.phone,
        address: formValue.address,
        country: formValue.country,
        currency: formValue.currency,
        timezone: formValue.timezone,
        language: formValue.language,
        logoUrl: formValue.logoUrl,
        planId: formValue.planId,
        isActive: formValue.isActive,
        notes: formValue.notes,
      };
      this.platformService.createTenant(dto).subscribe({
        next: () => {
          this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
          this.isSaving.set(false);
          this.router.navigate(['/platform/companies']);
        },
        error: () => {
          this.notificationService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
          this.isSaving.set(false);
        },
      });
    }
  }

  private slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  cancel(): void {
    this.router.navigate(['/platform/tenants']);
  }
}
