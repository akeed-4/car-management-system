import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, effect, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { InventoryService } from '../../../services/inventory.service';
import { GeminiService } from '../../../services/gemini.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CarModelService } from '../../../services/car-model.service';
import { ManufactureYearService } from '../../../services/manufacture-year.service';
import { FloorPlanService } from '../../../services/floor-plan.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { ExpenseService } from '../../../services/expense.service';

import { Car, CarCondition } from '../../../types/car.model';
import { PriceSuggestion } from '../../../types/price-suggestion.model';

import { ModalComponent } from '../../shared/modal/modal.component';
import { VinScannerComponent } from '../../shared/vin-scanner/vin-scanner.component';
import { PublishModalComponent } from '../../shared/publish-modal/publish-modal.component';

@Component({
  selector: 'app-car-card',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatRadioModule,
    TranslateModule,
    VinScannerComponent,
    PublishModalComponent
  ],
  templateUrl: './car-card.component.html',
  styleUrl: './car-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarCardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private geminiService = inject(GeminiService);
  private manufacturerService = inject(ManufacturerService);
  private carModelService = inject(CarModelService);
  private yearService = inject(ManufactureYearService);
  private floorPlanService = inject(FloorPlanService);
  private expenseService = inject(ExpenseService);
  private currentSettingService = inject(CurrentSettingService);
  private cdr = inject(ChangeDetectorRef);

  layout$ = this.currentSettingService.getCardLayout(3);
  private fb = inject(FormBuilder);

  // Form
  carForm!: FormGroup;

  // Signals for dropdowns
  manufacturers = this.manufacturerService.manufacturers$;
  allModels = toSignal(this.carModelService.getCarModels(), { initialValue: [] }) ?? null;
  years = this.yearService.years$;
  floorPlans = this.floorPlanService.floorPlans$;

  // Component state
  editMode = signal(false);
  pageTitle = signal('إضافة سيارة جديدة');

  // Current car being edited (for modals)
  car = computed(() => this.carForm?.value || {});

  // Selected photo for display
  selectedPhoto = signal<string | null>(null);

  // AI Price Suggestion State
  isSuggestingPrice = signal(false);
  priceSuggestionError = signal<string | null>(null);
  priceSuggestion = signal<PriceSuggestion | null>(null);

  // VIN Scanner Modal state
  isScannerOpen = signal(false);
  isPublishModalOpen = signal(false);

  // Profitability Tracking
  private allExpenses = this.expenseService.expenses$;
  associatedExpenses = computed(() => {
    const carId = this.carForm?.value?.id;
    if (!carId) return [];
    return this.allExpenses().filter(e => e.carId === carId);
  });

  calculatedTotalCost = computed(() => {
    const formValue = this.carForm?.value || {};
    const associatedCost = this.associatedExpenses().reduce((sum, exp) => sum + exp.amount, 0);
    return (formValue.purchasePrice ?? 0) + (formValue.additionalCosts ?? 0) + associatedCost;
  });

  // Computed signal for filtered models
  filteredModels = computed(() => {
    const carMake = this.carForm?.value?.make;
    const selectedManufacturer = this.manufacturers().find(m => m.name === carMake);
    if (!selectedManufacturer) {
      return [];
    }
    return this.allModels().filter(m => m.manufacturerId === selectedManufacturer.id);
  });

  canSuggestPrice = computed(() => {
    const formValue = this.carForm?.value || {};
    return formValue.make && formValue.model && formValue.year && formValue.mileage;
  });

  ngOnInit(): void {
    this.initForm();

    // Check if editing existing car
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات السيارة');
      this.loadCarForEdit(id);
    }
  }

  private initForm(): void {
    this.carForm = this.fb.group({
      id: [null],
      vin: [''],
      plateNumber: [''],
      istimaraExpiry: [''],
      fahasStatus: ['Valid'],
      make: [''],
      model: [''],
      year: [new Date().getFullYear()],
      condition: ['Used'],
      exteriorColor: [''],
      interiorColor: [''],
      mileage: [0],
      transmission: ['Automatic'],
      engineSize: [''],
      status: ['Available'],
      currentLocation: ['In Showroom'],
      photos: [['https://picsum.photos/800/600?random=10']],
      purchasePrice: [0],
      additionalCosts: [0],
      totalCost: [0],
      salePrice: [0],
      description: [''],
      purchaseDate: [new Date().toISOString().split('T')[0]],
      floorPlanId: [null],
      isArchived: [false],
      quantity: [1]
    });

    // Initialize selected photo from form
    const initialPhotos = this.carForm.value.photos;
    if (initialPhotos && initialPhotos.length > 0) {
      this.selectedPhoto.set(initialPhotos[0]);
    }
  }

  private loadCarForEdit(id: number): void {
    this.inventoryService.getCarById(id).subscribe({
      next: (existingCar) => {
        this.carForm.patchValue(existingCar);
        // Update selected photo from loaded car
        if (existingCar.photos && existingCar.photos.length > 0) {
          this.selectedPhoto.set(existingCar.photos[0]);
        }
      },
      error: (error) => {
        console.error('Error loading car:', error);
        this.router.navigate(['/inventory']);
      }
    });
  }

  onConditionChange(condition: CarCondition): void {
    this.carForm.patchValue({ condition });
    if (condition === 'New') {
      this.carForm.patchValue({ mileage: 0 });
    }
  }

  onVinScanned(vin: string): void {
    this.carForm.patchValue({ vin });
    this.isScannerOpen.set(false);
  }

  saveCar(): void {
    if (this.carForm.valid) {
      const carToSave = {
        ...this.carForm.value,
        totalCost: this.calculatedTotalCost()
      } as Car;

      if (this.editMode()) {
        this.inventoryService.updateCar(carToSave);
      } else {
        // id is not present on new cars
        const { id, ...newCar } = carToSave;
        this.inventoryService.addCar(newCar as Omit<Car, 'id'>);
      }
      this.router.navigate(['/inventory']);
    }
  }

  async suggestPrice(): Promise<void> {
    if (!this.canSuggestPrice()) return;

    this.isSuggestingPrice.set(true);
    this.priceSuggestionError.set(null);
    this.priceSuggestion.set(null);

    const carDetails = this.carForm.value;
    try {
      const suggestion = await this.geminiService.suggestPrice(carDetails);
      this.priceSuggestion.set(suggestion);
      // Automatically apply the average price
      this.carForm.patchValue({ salePrice: suggestion.average });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      this.priceSuggestionError.set(errorMessage);
    } finally {
      this.isSuggestingPrice.set(false);
    }
  }

  applySuggestedPrice(price: number): void {
    this.carForm.patchValue({ salePrice: price });
  }

  navigateToDepositForm(): void {
    const carId = this.carForm.value.id;
    if (carId) {
      this.router.navigate(['/accounts/deposits/new', carId]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Update the photos array in the form
        const currentPhotos = this.carForm.value.photos || [];
        const updatedPhotos = [base64String, ...currentPhotos.slice(1)]; // Replace first photo, keep others

        this.carForm.patchValue({
          photos: updatedPhotos
        });

        // Update the selected photo signal for immediate UI update
        this.selectedPhoto.set(base64String);

        // Mark form control as touched and trigger validation
        const photosControl = this.carForm.get('photos');
        if (photosControl) {
          photosControl.markAsTouched();
          photosControl.updateValueAndValidity();
        }

        // Force change detection for OnPush strategy
        this.carForm.updateValueAndValidity();
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    // Clear the photos array in the form
    this.carForm.patchValue({
      photos: []
    });

    // Clear the selected photo signal
    this.selectedPhoto.set(null);

    // Mark form control as touched and trigger validation
    const photosControl = this.carForm.get('photos');
    if (photosControl) {
      photosControl.markAsTouched();
      photosControl.updateValueAndValidity();
    }

    // Force change detection for OnPush strategy
    this.carForm.updateValueAndValidity();
    this.cdr.detectChanges();
  }
}
