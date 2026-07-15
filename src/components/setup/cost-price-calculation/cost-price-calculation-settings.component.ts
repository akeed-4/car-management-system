import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingService } from '../../../services/setting.service';
import { NotificationService } from '../../../services/notification.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import {
  CostPriceCalculationSetting,
  CostPriceCalculationMethod,
  COST_PRICE_CALCULATION_METHODS,
  CostPriceCalculationMethodOption
} from '../../../models/cost-price-calculation-setting.model';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cost-price-calculation-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './cost-price-calculation-settings.component.html',
  styleUrls: ['./cost-price-calculation-settings.component.css']
})
export class CostPriceCalculationSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingService = inject(SettingService);
  private notificationService = inject(NotificationService);
  private currentSettingService = inject(CurrentSettingService);
  private translate = inject(TranslateService);
  settingsForm!: FormGroup;
  calculationMethods = COST_PRICE_CALCULATION_METHODS;
  isLoading = false;
  currentSettings?: CostPriceCalculationSetting;

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
  }

  initializeForm(): void {
    this.settingsForm = this.fb.group({
      calculationMethod: [CostPriceCalculationMethod.FullCost, Validators.required],
      includeShippingCost: [true],
      includeCustomsDuties: [true],
      includeInsurance: [false],
      includeHandlingFees: [false],
      includeOtherExpenses: [false],
      defaultMarkupPercentage: [0, [Validators.min(0), Validators.max(100)]],
      applyVAT: [false],
      vatPercentage: [15, [Validators.min(0), Validators.max(100)]],
      isActive: [true]
    });

    // Watch calculation method changes to enable/disable cost components
    this.settingsForm.get('calculationMethod')?.valueChanges.subscribe(method => {
      this.updateCostComponentsState(method);
    });

    // Watch VAT toggle
    this.settingsForm.get('applyVAT')?.valueChanges.subscribe(applyVAT => {
      if (applyVAT) {
        this.settingsForm.get('vatPercentage')?.enable();
      } else {
        this.settingsForm.get('vatPercentage')?.disable();
      }
    });
  }

  updateCostComponentsState(method: CostPriceCalculationMethod): void {
    const controls = [
      'includeShippingCost',
      'includeCustomsDuties',
      'includeInsurance',
      'includeHandlingFees',
      'includeOtherExpenses'
    ];

    if (method === CostPriceCalculationMethod.PurchasePrice) {
      // Disable all cost components for purchase price only
      controls.forEach(control => {
        this.settingsForm.get(control)?.setValue(false);
        this.settingsForm.get(control)?.disable();
      });
    } else if (method === CostPriceCalculationMethod.PurchasePlusShipping) {
      // Enable shipping, disable others
      this.settingsForm.get('includeShippingCost')?.setValue(true);
      this.settingsForm.get('includeShippingCost')?.enable();
      controls.slice(1).forEach(control => {
        this.settingsForm.get(control)?.setValue(false);
        this.settingsForm.get(control)?.disable();
      });
    } else if (method === CostPriceCalculationMethod.FullCost) {
      // Enable all cost components
      controls.forEach(control => {
        this.settingsForm.get(control)?.enable();
      });
    } else {
      // For FIFO, LIFO, Average, Standard Cost methods
      controls.forEach(control => {
        this.settingsForm.get(control)?.disable();
      });
    }
  }

  loadSettings(): void {
    this.isLoading = true;
    const companyId = this.currentSettingService.getCompanyId();
    
    this.settingService.getCostPriceCalculationSettings(companyId).subscribe({
      next: (settings) => {
        if (settings) {
          this.currentSettings = settings;
          this.populateForm(settings);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.notificationService.showError('COST_PRICE_SETTINGS.LOAD_ERROR');
        this.isLoading = false;
      }
    });
  }

  populateForm(settings: CostPriceCalculationSetting): void {
    this.settingsForm.patchValue({
      calculationMethod: settings.calculationMethod,
      includeShippingCost: settings.includeShippingCost,
      includeCustomsDuties: settings.includeCustomsDuties,
      includeInsurance: settings.includeInsurance,
      includeHandlingFees: settings.includeHandlingFees,
      includeOtherExpenses: settings.includeOtherExpenses,
      defaultMarkupPercentage: settings.defaultMarkupPercentage,
      applyVAT: settings.applyVAT,
      vatPercentage: settings.vatPercentage,
      isActive: settings.isActive
    });

    this.updateCostComponentsState(settings.calculationMethod);
  }

  onSave(): void {
    if (this.settingsForm.invalid) {
      this.notificationService.showError('COST_PRICE_SETTINGS.VALIDATION_ERROR');
      return;
    }

    this.isLoading = true;
    const companyId = this.currentSettingService.getCompanyId();
    const formValue = this.settingsForm.getRawValue();

    const settings: CostPriceCalculationSetting = {
      ...this.currentSettings,
      companyId: companyId,
      calculationMethod: formValue.calculationMethod,
      includeShippingCost: formValue.includeShippingCost || false,
      includeCustomsDuties: formValue.includeCustomsDuties || false,
      includeInsurance: formValue.includeInsurance || false,
      includeHandlingFees: formValue.includeHandlingFees || false,
      includeOtherExpenses: formValue.includeOtherExpenses || false,
      defaultMarkupPercentage: formValue.defaultMarkupPercentage || 0,
      applyVAT: formValue.applyVAT || false,
      vatPercentage: formValue.vatPercentage || 0,
      isActive: formValue.isActive
    };

    this.settingService.saveCostPriceCalculationSettings(settings).subscribe({
      next: (savedSettings) => {
        this.currentSettings = savedSettings;
        this.notificationService.showSuccess('COST_PRICE_SETTINGS.SAVE_SUCCESS');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.notificationService.showError('COST_PRICE_SETTINGS.SAVE_ERROR');
        this.isLoading = false;
      }
    });
  }

  onReset(): void {
    if (this.currentSettings) {
      this.populateForm(this.currentSettings);
    } else {
      this.settingsForm.reset({
        calculationMethod: CostPriceCalculationMethod.FullCost,
        includeShippingCost: true,
        includeCustomsDuties: true,
        includeInsurance: false,
        includeHandlingFees: false,
        includeOtherExpenses: false,
        defaultMarkupPercentage: 0,
        applyVAT: false,
        vatPercentage: 15,
        isActive: true
      });
    }
  }

  getMethodDescription(method: CostPriceCalculationMethod): string {
    const option = this.calculationMethods.find(m => m.value === method);
    return option?.description || '';
  }
}
