import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, effect, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { InventoryService } from '../../../../services/inventory.service';
import { GeminiService } from '../../../../services/gemini.service';
import { ManufacturerService } from '../../../../services/manufacturer.service';
import { CarModelService } from '../../../../services/car-model.service';
import { ManufactureYearService } from '../../../../services/manufacture-year.service';
import { FloorPlanService } from '../../../../services/floor-plan.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { ExpenseService } from '../../../../services/expense.service';
import { ToastService } from '../../../../services/toast.service';
import { CarCategoryService } from '../../../../services/car-category.service';
import { PermissionService } from '../../../../services/permission.service';

import { Car, CarCondition } from '../../../../models/car.model';
import { PriceSuggestion } from '../../../../models/price-suggestion.model';
import { CarCategory } from '../../../../types/car-category.model';
import { Manufacturer } from '../../../../models/manufacturer.model';
import { CarModel } from '../../../../models/car-model.model';

import { ModalComponent } from '../../../shared/modal/modal.component';
import { VinScannerComponent } from '../../../shared/vin-scanner/vin-scanner.component';
import { PublishModalComponent } from '../../../shared/publish-modal/publish-modal.component';
import { NotificationService } from '@/src/services/notification.service';
import { ManufacturersComponent } from '../../manufacturers/manufacturers-list/manufacturers.component';
import { CarModelsComponent, CarModelQuickAddData } from '../../car-models/car-models-list/car-models.component';
import { CarCategoryFormComponent, CarCategoryQuickAddData } from '../../car-category/car-category-form/car-category-form.component';

@Component({
  selector: 'app-car-card',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatTooltipModule,
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
  private toastService = inject(NotificationService);
  private carCategoryService = inject(CarCategoryService);
  private notificationService = inject(NotificationService);
  private permissionService = inject(PermissionService);
  private dialog = inject(MatDialog);
private translate = inject(TranslateService);
  layout$ = this.currentSettingService.getCardLayout(3);
  private fb = inject(FormBuilder);

  // Form
  carForm!: FormGroup;

  // Signals for dropdowns
  manufacturers = this.manufacturerService.manufacturers$;
  allModels = this.carModelService.carmodel$;
  years = this.yearService.years$;
  floorPlans = this.floorPlanService.floorPlans$;
  categories = this.carCategoryService.categories$;
  filteredCategories = signal<CarCategory[]>([]);

  // Component state
  editMode = signal(false);
  pageTitle = signal('INVENTORY.FORM.PAGE_TITLE_NEW');
  selectedManufacturerId = signal<number | null>(null);
  selectedCategoryId = signal<number | null>(null);
  categoryModelIds = signal<number[]>([]);

  // Current car being edited (for modals)
  car = computed(() => this.carForm?.value || {});

  // Selected model name from modelId
  selectedModel = computed(() => {
    const modelId = this.carForm?.value?.modelId;
    if (!modelId) return '';
    const model = this.allModels().find(m => m.id === modelId);
    return model ? model.name : '';
  });

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
    const manufacturerId = this.selectedManufacturerId();
    const catModelIds = this.categoryModelIds();
    let models = null;
    if (manufacturerId) {
      models =  this.allModels().filter(m => m.manufacturerId === manufacturerId);
    }
    if (catModelIds.length > 0) {
      models =  this.allModels().filter(m => catModelIds.includes(m.id));
    }
    return models;
  });
  constructor() { 
     // Reset model when manufacturer changes and set manufacturerId
     effect(() => {
       const make = this.carForm?.value?.make;
       if (make && this.carForm) {
         const selectedManufacturer = this.manufacturers().find(m => m.name === make);
         this.carForm.patchValue({ 
           modelId: null,
           manufacturerId: selectedManufacturer?.id || null
         }, { emitEvent: true });
         this.filteredCategories.set([]);
         this.cdr.markForCheck();
       }
     });
  }
  canSuggestPrice = computed(() => {
    const formValue = this.carForm?.value || {};
    return formValue.make && formValue.model && formValue.year && formValue.mileage;
  });

  ngOnInit(): void {
    this.initForm();
    this.filteredCategories.set([]);

    // Check if editing existing car
    const idParam = this.route.snapshot.queryParams['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('INVENTORY.FORM.PAGE_TITLE_EDIT');
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
      manufacturerId: [null],
      make: [''],
      modelId: [null],
      categoryId: [null],
      year: [new Date().getFullYear()],
      condition: ['Used'],
      exteriorColor: ['', Validators.required],
      interiorColor: ['', Validators.required],
      mileage: [0],
      transmission: ['Automatic'],
      engineSize: ['', Validators.required],
      status: ['Available'],
      currentLocation: ['In Showroom'],
      photos: [[]], // Initialize as empty array
      purchasePrice: [0],
      additionalCosts: [0],
      totalCost: [0],
      salePrice: [0],
      description: ['', Validators.required],
      purchaseDate: [new Date().toISOString().split('T')[0]],
      floorPlanId: [null],
      isArchived: [false],
      quantity: [1],
      trackByBatch: [true],
      calculateVATFromProfitMargin: [false]
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
        // Ensure photos is an array of strings
        if (!existingCar.photos || !Array.isArray(existingCar.photos)) {
          existingCar.photos = [];
        } else {
          // Filter to ensure all elements are strings
          existingCar.photos = existingCar.photos.filter((photo): photo is string => typeof photo === 'string');
        }
        this.carForm.patchValue(existingCar);
        // Set manufacturerId, modelId, yearId from existing data
        const manufacturer = this.manufacturers().find(m => m.name === existingCar.make);
        if (manufacturer) {
          this.selectedManufacturerId.set(manufacturer.id);
          this.carForm.patchValue({ manufacturerId: manufacturer.id });
        }
        
        const model = this.allModels().find(m => m.name === existingCar.model);
        if (model) {
          this.carForm.patchValue({ modelId: model.id });
          // Filter categories based on the loaded model
          const filtered = this.categories().filter(m => m.modelId === model.id);
          this.filteredCategories.set(filtered);
        }
        
    
        
        // Update selected photo from loaded car
        if (existingCar.photos && existingCar.photos.length > 0) {
          this.selectedPhoto.set(existingCar.photos[0]);
        }
      },
      error: (error) => {
        console.error('Error loading car:', error);
        this.router.navigate(['/setup/card']);
      }
    });
  }
backToCard(): void {
     this.router.navigate(['/setup/cars']);
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

  onManufacturerChange(manufacturerName: string): void {
    const manufacturer = this.manufacturers().find(m => m.name === manufacturerName);
    if (manufacturer) {
      this.selectedManufacturerId.set(manufacturer.id);
      this.carForm.patchValue({ 
        manufacturerId: manufacturer.id,
        modelId: null 
      }, { emitEvent: true });
      this.cdr.markForCheck();
    }
  }

  onModelChange(modelId: number): void {
    // Reset category when model changes
    if (modelId) {
      debugger
      const filtered = this.categories().filter(m => m.modelId === modelId);
      this.filteredCategories.set(filtered);
    } else {
      this.filteredCategories.set([]);
    }
    // Model name is computed in selectedModel signal
  }

  // --- Inline "+" quick-add for the Manufacturer/Model/Category lookup dropdowns -----------------
  // Each opens the SAME create screen already used by /setup/manufacturers, /setup/car-models and
  // /setup/car-categories/new as a MatDialog (see their @Optional() MatDialogRef support), instead
  // of a separate dialog-only component -- no duplicated form markup or duplicated API calls.

  canAddManufacturer = computed(() => true); // Always allow adding a new manufacturer
  canAddCarModel = computed(() => true);
  canAddCarCategory = computed(() => true);

  openAddManufacturerDialog(): void {
    const dialogRef = this.dialog.open(ManufacturersComponent, {
      width: '480px',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((created?: Manufacturer) => {
      if (!created) return; // cancelled, or an error kept the dialog data unset -- leave the form untouched
      this.selectedManufacturerId.set(created.id);
      // "make" (not manufacturerId) is the control the Manufacturer <mat-select> is actually bound
      // to -- see the constructor's effect() that derives manufacturerId from it. Patching only
      // manufacturerId would leave the select showing its previous value.
      this.carForm.patchValue({
        make: created.name,
        manufacturerId: created.id,
        modelId: null
      }, { emitEvent: true });
      this.filteredCategories.set([]);
      this.cdr.markForCheck();
    });
  }

  openAddCarModelDialog(): void {
    const manufacturerId = this.selectedManufacturerId();
    if (!manufacturerId) return; // Model depends on Manufacturer -- button is disabled in the template for this case too

    const data: CarModelQuickAddData = { manufacturerId };
    const dialogRef = this.dialog.open(CarModelsComponent, {
      width: '480px',
      autoFocus: false,
      data
    });

    dialogRef.afterClosed().subscribe((created?: CarModel) => {
      if (!created) return;
      this.carForm.patchValue({ modelId: created.id }, { emitEvent: true });
      this.onModelChange(created.id);
      this.cdr.markForCheck();
    });
  }

  openAddCarCategoryDialog(): void {
    const modelId = this.carForm.value.modelId;
    if (!modelId) return; // Category depends on Model -- button is disabled in the template for this case too

    const data: CarCategoryQuickAddData = { modelId };
    const dialogRef = this.dialog.open(CarCategoryFormComponent, {
      width: '600px',
      autoFocus: false,
      data
    });

    dialogRef.afterClosed().subscribe((created?: CarCategory) => {
      if (!created) return;
      this.filteredCategories.update(list =>
        list.some(c => c.id === created.id) ? list : [...list, created]
      );
      this.carForm.patchValue({ categoryId: created.id }, { emitEvent: true });
      this.cdr.markForCheck();
    });
  }



  async saveCar(): Promise<void> {
    if (this.carForm.valid) {
      const formValue = this.carForm.value;
      
      // Remove fields that don't belong in the API request
      const { id, manufacturerId, modelId, trackByBatch, totalCost, ...carData } = formValue;
      
      const carToSave = {
        ...carData,
        model: this.selectedModel(),
        totalCost: this.calculatedTotalCost(),
        // Ensure required fields have proper values
        purchasePrice: carData.purchasePrice || 0,
        additionalCosts: carData.additionalCosts || 0,
        salePrice: carData.salePrice || 0,
        mileage: carData.mileage || 0,
        quantity: carData.quantity || 1,
        photos: Array.isArray(carData.photos) ? carData.photos : [],
        // Convert empty strings to null for optional fields
        floorPlanId: carData.floorPlanId || null,
        categoryId: carData.categoryId || null,
        chassisNumber: carData.chassisNumber || null,
        ownerName: carData.ownerName || null,
        ownerIdNumber: carData.ownerIdNumber || null,
        ownerPhone: carData.ownerPhone || null,
        authorizedSellerName: carData.authorizedSellerName || null,
        authorizedSellerIdNumber: carData.authorizedSellerIdNumber || null,
        authorizedSellerPhone: carData.authorizedSellerPhone || null,
        authorizationDocumentNumber: carData.authorizationDocumentNumber || null,
        carType: carData.carType || null,
        transportationType: carData.transportationType || null
      };

      try {
        if (this.editMode()) {
          const carToUpdate = { ...carToSave, id: formValue.id };
          await firstValueFrom(this.inventoryService.updateCar(carToUpdate as Car));
          this.notificationService.showSuccess(this.translate.instant('TOAST.EDIT_SUCCESS'));
        } else {
          await this.inventoryService.addCar(carToSave as any);
          this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
        }
        // Refresh the cars list
        this.inventoryService.loadCars();
        this.router.navigate(['/setup/cars']);
      } catch (error) {
        console.error('Error saving car:', error);
        if (error instanceof HttpErrorResponse) {
          if (error.error?.errors) {
            // Extract validation errors from the response
            const validationErrors = Object.entries(error.error.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
            console.error('Validation errors:', validationErrors);
            this.notificationService.showError(`${this.translate.instant('INVENTORY.FORM.VALIDATION_FAILED_PREFIX')}\n${validationErrors}`);
          } else if (error.error?.title) {
            this.notificationService.showError(error.error.title);
          } else {
            this.notificationService.showError(this.translate.instant('INVENTORY.FORM.GENERIC_HTTP_ERROR', { status: error.status, statusText: error.statusText }));
          }
        } else {
          this.notificationService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        }
      }
    } else {
      this.notificationService.showWarning(this.translate.instant('TOAST.VALIDATION_ERROR'));
    }
  }

  async suggestPrice(): Promise<void> {
    if (!this.canSuggestPrice()) return;

    this.isSuggestingPrice.set(true);
    this.priceSuggestionError.set(null);
    this.priceSuggestion.set(null);

    const carDetails = { ...this.carForm.value, model: this.selectedModel() };
    try {
      const suggestion = await this.geminiService.suggestPrice(carDetails);
      this.priceSuggestion.set(suggestion);
      // Automatically apply the average price
      this.carForm.patchValue({ salePrice: suggestion.average });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : this.translate.instant('INVENTORY.FORM.UNKNOWN_ERROR_OCCURRED');
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
      this.router.navigate(['setup/cars', carId]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.notificationService.showError('INVENTORY.FORM.SELECT_IMAGE_FILE_ERROR');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.showError('INVENTORY.FORM.IMAGE_TOO_LARGE_ERROR');
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

  cancelForm(): void {
    this.router.navigate(['/setup/cars']);
  }
}
