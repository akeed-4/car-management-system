import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import {
  CreateSubscriptionPlanDto,
  PLAN_FEATURE_KEYS,
  PLAN_FEATURE_NAMES,
  PLAN_METRIC_KEYS,
  SubscriptionPlanDto,
} from '../../../../models/platform/subscription-plan.model';

@Component({
  selector: 'app-plan-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './plan-details.component.html',
  styleUrl: './plan-details.component.css',
})
export class PlanDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  planForm!: FormGroup;
  isEdit = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  planId = signal<number | null>(null);

  constructor() {
    this.initForm();
  }

  get limitsArray(): FormArray {
    return this.planForm.get('limits') as FormArray;
  }

  get featuresArray(): FormArray {
    return this.planForm.get('features') as FormArray;
  }

  private initForm(): void {
    this.planForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      sortOrder: [0],
      isActive: [true],
      priceMonthly: [0, [Validators.required, Validators.min(0)]],
      priceQuarterly: [0, [Validators.required, Validators.min(0)]],
      priceSemiAnnual: [0, [Validators.required, Validators.min(0)]],
      priceYearly: [0, [Validators.required, Validators.min(0)]],
      priceLifetime: [null],
      limits: this.fb.array(PLAN_METRIC_KEYS.map(key => this.buildLimitGroup(key, null))),
      features: this.fb.array(PLAN_FEATURE_KEYS.map(key => this.buildFeatureGroup(key, false))),
    });
  }

  private buildLimitGroup(metricKey: string, maxValue: number | null) {
    return this.fb.group({
      metricKey: [metricKey],
      unlimited: [maxValue === null],
      maxValue: [maxValue ?? 0],
    });
  }

  featureName(featureKey: string): string {
    const names = PLAN_FEATURE_NAMES[featureKey];
    if (!names) return featureKey;
    return this.translate.currentLang === 'ar' ? names.nameAr : names.nameEn;
  }

  private buildFeatureGroup(featureKey: string, isEnabled: boolean) {
    return this.fb.group({
      featureKey: [featureKey],
      isEnabled: [isEnabled],
    });
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.params['id'];
    if (routeId) {
      this.isEdit.set(true);
      this.planId.set(+routeId);
      this.loadPlan(+routeId);
    }
  }

  private loadPlan(id: number): void {
    this.isLoading.set(true);
    this.platformService.getPlanById(id).subscribe({
      next: (plan) => {
        this.populateForm(plan);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('TOAST.LOAD_ERROR');
        this.isLoading.set(false);
        this.router.navigate(['/platform/plans']);
      },
    });
  }

  private populateForm(plan: SubscriptionPlanDto): void {
    this.planForm.patchValue({
      code: plan.code,
      name: plan.name,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
      priceMonthly: plan.priceMonthly,
      priceQuarterly: plan.priceQuarterly,
      priceSemiAnnual: plan.priceSemiAnnual,
      priceYearly: plan.priceYearly,
      priceLifetime: plan.priceLifetime,
    });

    PLAN_METRIC_KEYS.forEach((key, index) => {
      const existing = plan.limits.find(l => l.metricKey === key);
      this.limitsArray.at(index).patchValue({
        unlimited: existing ? existing.maxValue === null : false,
        maxValue: existing?.maxValue ?? 0,
      });
    });

    PLAN_FEATURE_KEYS.forEach((key, index) => {
      const existing = plan.features.find(f => f.featureKey === key);
      this.featuresArray.at(index).patchValue({ isEnabled: existing?.isEnabled ?? false });
    });
  }

  onSubmit(): void {
    if (this.planForm.invalid) {
      this.notificationService.showWarning('TOAST.VALIDATION_ERROR');
      return;
    }

    const value = this.planForm.getRawValue();
    const dto: CreateSubscriptionPlanDto = {
      code: value.code,
      name: value.name,
      sortOrder: value.sortOrder,
      isActive: value.isActive,
      priceMonthly: value.priceMonthly,
      priceQuarterly: value.priceQuarterly,
      priceSemiAnnual: value.priceSemiAnnual,
      priceYearly: value.priceYearly,
      priceLifetime: value.priceLifetime,
      limits: value.limits.map((l: { metricKey: string; unlimited: boolean; maxValue: number }) => ({
        metricKey: l.metricKey,
        maxValue: l.unlimited ? null : l.maxValue,
      })),
      features: value.features.map((f: { featureKey: string; isEnabled: boolean }) => ({
        featureKey: f.featureKey,
        nameEn: PLAN_FEATURE_NAMES[f.featureKey]?.nameEn ?? f.featureKey,
        nameAr: PLAN_FEATURE_NAMES[f.featureKey]?.nameAr ?? f.featureKey,
        isEnabled: f.isEnabled,
      })),
    };

    this.isSaving.set(true);
    const request = this.isEdit() && this.planId()
      ? this.platformService.updatePlan(this.planId()!, dto)
      : this.platformService.createPlan(dto);

    request.subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant(this.isEdit() ? 'TOAST.EDIT_SUCCESS' : 'TOAST.ADD_SUCCESS'));
        this.isSaving.set(false);
        this.router.navigate(['/platform/plans']);
      },
      error: () => {
        this.notificationService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        this.isSaving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/platform/plans']);
  }
}
