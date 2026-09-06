import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, effect, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, startWith } from 'rxjs';

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
import { VehicleColorService } from '../../../../services/vehicle-color.service';
import { YearSpecificationService } from '../../../../services/year-specification.service';

import { Car, CarCondition } from '../../../../models/car.model';
import { VehicleColor } from '../../../../models/vehicle-color.model';
import { PriceSuggestion } from '../../../../models/price-suggestion.model';
import { CarCategory } from '../../../../types/car-category.model';
import { Manufacturer } from '../../../../models/manufacturer.model';
import { CarModel } from '../../../../models/car-model.model';
import { YearSpecification } from '../../../../models/year-specification.model';

import { ModalComponent } from '../../../shared/modal/modal.component';
import { VinScannerComponent } from '../../../shared/vin-scanner/vin-scanner.component';
import { NotificationService } from '@/src/services/notification.service';
import { ManufacturersComponent } from '../../manufacturers/manufacturers-list/manufacturers.component';
import { CarModelsComponent, CarModelQuickAddData } from '../../car-models/car-models-list/car-models.component';
import { CarCategoryFormComponent, CarCategoryQuickAddData } from '../../car-category/car-category-form/car-category-form.component';
import { YearSpecificationFormComponent, YearSpecificationQuickAddData } from '../../year-specifications/year-specification-form/year-specification-form.component';
import { VehicleColorFormComponent } from '../../vehicle-colors/vehicle-color-form/vehicle-color-form.component';

/** Requirement 8: VIN/chassis number must not accept Arabic characters -- English letters and
 * numbers only, matching the backend's VehicleValidation.ValidateVin. Frontend-only convenience;
 * the backend is still the enforcing authority (see CarService.CreateCarAsync/UpdateCarAsync). */
const VIN_PATTERN = /^[A-Za-z0-9]+$/;

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
    MatTooltipModule,
    NgxMatSelectSearchModule,
    TranslateModule,
    VinScannerComponent
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
  private vehicleColorService = inject(VehicleColorService);
  private yearSpecificationService = inject(YearSpecificationService);
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
  vehicleColors = signal<VehicleColor[]>([]);

  /** Year Specifications belonging to the currently selected Trim (categoryId) -- populates the
   *  Make -> Model -> Trim -> Year Specification cascading dropdown's final level. Loaded fresh
   *  from the backend on each Trim change rather than client-filtered, since (unlike
   *  Manufacturer/Model/Category, all small flat dictionaries already loaded in full) Year
   *  Specifications can grow large across many Trims. */
  filteredYearSpecs = signal<YearSpecification[]>([]);

  /** The full record for the selected Year Specification -- the single source the read-only
   *  technical specification fields below are displayed from. */
  selectedYearSpecification = computed<YearSpecification | null>(() => {
    const id = this.carForm?.value?.yearSpecificationId;
    if (!id) return null;
    return this.filteredYearSpecs().find(s => s.id === id) ?? null;
  });

  // Component state
  editMode = signal(false);
  pageTitle = signal('INVENTORY.FORM.PAGE_TITLE_NEW');
  selectedManufacturerId = signal<number | null>(null);
  selectedCategoryId = signal<number | null>(null);
  categoryModelIds = signal<number[]>([]);

  // ── Wizard step state ─────────────────────────────────────────────────────────────────────
  // carForm stays a single flat FormGroup (unchanged FormControl names/validators/business
  // logic); the wizard only groups its controls into steps for display and gates Next by
  // checking the validity of each step's own control subset.
  currentStep = signal(0);

  readonly stepFieldNames: string[][] = [
    ['make', 'modelId', 'categoryId', 'yearSpecificationId', 'currentLocation', 'condition', 'vin', 'plateNumber', 'istimaraExpiry', 'fahasStatus'],
    ['mileage', 'exteriorColorId', 'interiorColorId', 'engineSize'],
    ['purchasePrice', 'salePrice'],
    ['description'],
  ];

  readonly stepLabels: string[] = [
    'INVENTORY.FORM.CARD_STEP1_TITLE',
    'INVENTORY.FORM.CARD_STEP2_TITLE',
    'INVENTORY.FORM.STEP3_TITLE',
    'INVENTORY.FORM.DESCRIPTION_PHOTOS',
    'INVENTORY.FORM.REVIEW',
  ];

  private stepControlsValue = signal<any>({});

  stepValid = computed(() => {
    const value = this.stepControlsValue();
    const fields = this.stepFieldNames[this.currentStep()] ?? [];
    return fields.every(name => {
      const control = this.carForm?.get(name);
      return !control || control.valid;
    });
  });

  // Current car being edited (for modals)
  car = computed(() => this.carForm?.value || {});

  // Selected exterior color name from exteriorColorId, for the section-panel summary
  selectedExteriorColorName = computed(() => {
    const colorId = this.carForm?.value?.exteriorColorId;
    if (!colorId) return '';
    const color = this.vehicleColors().find(c => c.id === colorId);
    return color ? color.nameEn : '';
  });

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

  // ── Type-ahead search for the Manufacturer/Model/Category/Year Specification selects ──────────
  // Each list here is already small/cascaded by the logic above; these filter controls only add a
  // client-side substring narrowing on top (ngx-mat-select-search, same pattern already used for
  // Purchase Invoice's Supplier field) so long lists don't require scrolling to find an entry.
  manufacturerFilterCtrl = new FormControl('');
  modelFilterCtrl = new FormControl('');
  categoryFilterCtrl = new FormControl('');
  yearSpecFilterCtrl = new FormControl('');

  private manufacturerFilterSignal = toSignal(this.manufacturerFilterCtrl.valueChanges, { initialValue: '' });
  private modelFilterSignal = toSignal(this.modelFilterCtrl.valueChanges, { initialValue: '' });
  private categoryFilterSignal = toSignal(this.categoryFilterCtrl.valueChanges, { initialValue: '' });
  private yearSpecFilterSignal = toSignal(this.yearSpecFilterCtrl.valueChanges, { initialValue: '' });

  searchedManufacturers = computed(() => {
    const filter = this.manufacturerFilterSignal()?.toLowerCase() ?? '';
    return this.manufacturers().filter(m => m.name?.toLowerCase().includes(filter));
  });

  searchedModels = computed(() => {
    const filter = this.modelFilterSignal()?.toLowerCase() ?? '';
    return (this.filteredModels() ?? []).filter(m => m.name?.toLowerCase().includes(filter));
  });

  searchedCategories = computed(() => {
    const filter = this.categoryFilterSignal()?.toLowerCase() ?? '';
    return this.filteredCategories().filter(c => (c.nameEn || c.name)?.toLowerCase().includes(filter));
  });

  searchedYearSpecs = computed(() => {
    const filter = this.yearSpecFilterSignal()?.toLowerCase() ?? '';
    return this.filteredYearSpecs().filter(s => String(s.year).includes(filter));
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
    this.loadVehicleColors();

    this.carForm.valueChanges
      .pipe(startWith(this.carForm.value))
      .subscribe(value => this.stepControlsValue.set(value));

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
      vin: ['', Validators.pattern(VIN_PATTERN)],
      plateNumber: [''],
      istimaraExpiry: [''],
      fahasStatus: ['Valid'],
      manufacturerId: [null],
      make: [''],
      modelId: [null],
      categoryId: [null],
      // Requirement 6: the vehicle's Model Year comes from the selected Year Specification, not a
      // free-standing dropdown -- see yearSpecificationId below and onYearSpecificationChange.
      yearSpecificationId: [null, Validators.required],
      year: [new Date().getFullYear()],
      condition: ['Used'],
      exteriorColor: [''],
      interiorColor: [''],
      exteriorColorId: [null, Validators.required],
      interiorColorId: [null, Validators.required],
      mileage: [0, [Validators.required, Validators.min(0)]],
      // Transmission/engineSize plus the technical-spec-only fields below are all read-only once a
      // Year Specification is selected (Requirement 6) -- auto-filled by onYearSpecificationChange,
      // never hand-typed. cylinderCount/horsepower/fuelType/driveType/standardAgencyPrice have no
      // pre-existing home on the Car entity; they exist here purely for display.
      transmission: ['Automatic'],
      engineSize: ['', Validators.required],
      cylinderCount: [null],
      horsepower: [null],
      fuelType: [''],
      driveType: [''],
      standardAgencyPrice: [null],
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

        // Requirement 8: reconstruct the cascading hierarchy from the vehicle's own IDs --
        // ManufacturerId/ModelId/CategoryId/YearSpecificationId, now returned directly by the
        // backend -- instead of matching the Make/Model *name* strings, which is fragile (breaks
        // silently on renames, and can match the wrong record if names collide across Makes).
        if (existingCar.manufacturerId) {
          this.selectedManufacturerId.set(existingCar.manufacturerId);
          this.carForm.patchValue({ manufacturerId: existingCar.manufacturerId });
        }

        if (existingCar.modelId) {
          this.carForm.patchValue({ modelId: existingCar.modelId });
          // Filter Trims based on the loaded Model.
          const filtered = this.categories().filter(c => c.modelId === existingCar.modelId);
          this.filteredCategories.set(filtered);
        }

        if (existingCar.categoryId) {
          this.carForm.patchValue({ categoryId: existingCar.categoryId }, { emitEvent: false });
        }

        // Load the Trim's Year Specifications so the dropdown has options, then patch the
        // vehicle's own already-saved technical-spec fields back in afterward -- onCategoryChange
        // would otherwise reset yearSpecificationId/tech specs to blank as its normal "Trim
        // changed" behavior, which is wrong here: the Trim didn't change, it's just loading.
        if (existingCar.categoryId) {
          this.yearSpecificationService.getByTrimId(existingCar.categoryId).subscribe({
            next: (specs) => {
              this.filteredYearSpecs.set(specs);
              this.carForm.patchValue({
                yearSpecificationId: existingCar.yearSpecificationId ?? null,
                transmission: existingCar.transmission,
                engineSize: existingCar.engineSize,
                cylinderCount: existingCar.cylinderCount ?? null,
                horsepower: existingCar.horsepower ?? null,
                fuelType: existingCar.fuelType ?? '',
                driveType: existingCar.driveType ?? '',
                standardAgencyPrice: existingCar.standardAgencyPrice ?? null
              }, { emitEvent: false });
              this.cdr.markForCheck();
            },
            error: (error) => console.error('Failed to load year specifications for trim', error)
          });
        }

        // Update selected photo from loaded car
        if (existingCar.photos && existingCar.photos.length > 0) {
          this.selectedPhoto.set(existingCar.photos[0]);
        }
      },
      error: (error) => {
        console.error('Error loading car:', error);
        this.router.navigate(['/setup/car-card']);
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
      this.filteredCategories.set([]);
      this.resetTrimAndBelow();
      this.cdr.markForCheck();
    }
  }

  onModelChange(modelId: number | null): void {
    // Requirement 9: the Model changing invalidates whatever Trim/Year Specification/technical
    // specs were previously selected -- clear them before loading the new Model's Trims, so a
    // stale Trim from the old Model is never left selected.
    this.resetTrimAndBelow();
    if (modelId) {
      const filtered = this.categories().filter(m => m.modelId === modelId);
      this.filteredCategories.set(filtered);
    } else {
      this.filteredCategories.set([]);
    }
    // Model name is computed in selectedModel signal
  }

  /** Requirement 9: Trim changing invalidates the previously selected Year Specification and
   *  everything derived from it. Requirement 4/6: loads the Year Specifications belonging to the
   *  new Trim for the next cascading level. */
  onCategoryChange(categoryId: number | null): void {
    this.resetYearSpecAndBelow();
    if (!categoryId) return;
    this.yearSpecificationService.getByTrimId(categoryId).subscribe({
      next: (specs) => this.filteredYearSpecs.set(specs),
      error: (error) => console.error('Failed to load year specifications for trim', error)
    });
  }

  /** Requirement 6: selecting a Year Specification automatically loads its technical
   *  specifications into the (read-only) fields below -- the user never re-types them per vehicle. */
  onYearSpecificationChange(yearSpecificationId: number | null): void {
    const spec = yearSpecificationId
      ? this.filteredYearSpecs().find(s => s.id === yearSpecificationId)
      : null;

    if (!spec) {
      this.resetYearSpecFieldsOnly();
      return;
    }

    this.carForm.patchValue({
      yearSpecificationId: spec.id,
      year: spec.year,
      transmission: spec.transmission,
      engineSize: [spec.engineCapacity, spec.engineType].filter(Boolean).join(' '),
      cylinderCount: spec.cylinderCount,
      horsepower: spec.horsepower,
      fuelType: spec.fuelType,
      driveType: spec.driveType,
      standardAgencyPrice: spec.standardAgencyPrice
    }, { emitEvent: false });
    this.cdr.markForCheck();
  }

  /** Clears the Trim + Year Specification + all read-only technical-spec fields (Requirement 9) --
   *  used when the Model changes, since the previously selected Trim can no longer be valid. */
  private resetTrimAndBelow(): void {
    this.carForm.patchValue({ categoryId: null }, { emitEvent: false });
    this.resetYearSpecAndBelow();
  }

  /** Clears the Year Specification + technical-spec fields (Requirement 9), leaving categoryId
   *  itself untouched -- used when the Trim changes to a NEW value the caller is about to set. */
  private resetYearSpecAndBelow(): void {
    this.filteredYearSpecs.set([]);
    this.resetYearSpecFieldsOnly();
  }

  private resetYearSpecFieldsOnly(): void {
    this.carForm.patchValue({
      yearSpecificationId: null,
      transmission: '',
      engineSize: '',
      cylinderCount: null,
      horsepower: null,
      fuelType: '',
      driveType: '',
      standardAgencyPrice: null
    }, { emitEvent: false });
    this.cdr.markForCheck();
  }

  // --- Inline "+" quick-add for the Manufacturer/Model/Category lookup dropdowns -----------------
  // Each opens the SAME create screen already used by /setup/manufacturers, /setup/car-models and
  // /setup/car-categories/new as a MatDialog (see their @Optional() MatDialogRef support), instead
  // of a separate dialog-only component -- no duplicated form markup or duplicated API calls.

  canAddManufacturer = computed(() => this.permissionService.hasPermission('manufacturer.create'));
  canAddCarModel = computed(() => this.permissionService.hasPermission('carModel.create'));
  canAddCarCategory = computed(() => this.permissionService.hasPermission('carCategory.create'));
  canAddYearSpecification = computed(() => this.permissionService.hasPermission('yearSpecification.create'));

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
      this.resetTrimAndBelow();
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
      this.onCategoryChange(created.id);
      this.cdr.markForCheck();
    });
  }

  openAddYearSpecificationDialog(): void {
    const trimId = this.carForm.value.categoryId;
    if (!trimId) return; // Year Specification depends on Trim -- button is disabled in the template for this case too

    const data: YearSpecificationQuickAddData = { trimId };
    const dialogRef = this.dialog.open(YearSpecificationFormComponent, {
      // Wider than the other quick-add dialogs (480-600px) -- this form has 12 fields (4
      // cascading dropdowns + 8 technical-spec inputs) and needs the 2-column layout's full width
      // to fit without an internal scrollbar (see the component's own CSS comment).
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false,
      data
    });

    dialogRef.afterClosed().subscribe((created?: YearSpecification) => {
      if (!created) return;
      this.filteredYearSpecs.update(list =>
        list.some(s => s.id === created.id) ? list : [...list, created]
      );
      this.onYearSpecificationChange(created.id);
      this.cdr.markForCheck();
    });
  }

  private loadVehicleColors(): void {
    this.vehicleColorService.getActive().subscribe({
      next: (colors) => this.vehicleColors.set(colors),
      error: (error) => console.error('Failed to load vehicle colors', error)
    });
  }

  /** Requirement 8/9-style quick-add: opens the same VehicleColor create form used for both
   * Exterior and Interior Color "+" buttons, then patches the newly created color into whichever
   * field triggered it. */
  openAddVehicleColorDialog(field: 'exteriorColorId' | 'interiorColorId'): void {
    const dialogRef = this.dialog.open(VehicleColorFormComponent, {
      width: '420px',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((created?: VehicleColor) => {
      if (!created) return;
      this.vehicleColors.update(list => [...list, created]);
      this.carForm.patchValue({ [field]: created.id }, { emitEvent: true });
      this.cdr.markForCheck();
    });
  }



  async saveCar(): Promise<void> {
    if (this.carForm.valid) {
      const formValue = this.carForm.value;

      // Remove fields that don't belong in the API request. manufacturerId/modelId/categoryId/
      // yearSpecificationId are NOT stripped here (a prior version of this method dropped
      // manufacturerId/modelId entirely, which meant a vehicle's Make/Model were never actually
      // persisted as real foreign keys -- only the legacy free-text make/model strings were saved,
      // silently breaking the whole cascading hierarchy and Requirement 8's edit reconstruction).
      const { id, trackByBatch, totalCost, ...carData } = formValue;

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
          // Refresh the cars list
          this.inventoryService.loadCars();
          this.router.navigate(['/setup/cars']);
        } else {
          const createdCar = await this.inventoryService.addCar(carToSave as any);
          this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
          // Refresh the cars list
          this.inventoryService.loadCars();
          await this.offerVehicleStickerPrint(createdCar);
          this.router.navigate(['/setup/cars']);
        }
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

  /**
   * Offers to print the vehicle sticker/label right after a NEW car is created, reusing the
   * existing label feature as-is (same route, same component, same permission) rather than
   * duplicating it -- see inventory-list.component.ts's 'label' row action for the original.
   * Create-only by construction (only called from saveCar()'s create branch): Edit Car's own
   * sticker entry point (the inventory list row action) is untouched.
   */
  private async offerVehicleStickerPrint(createdCar: Car): Promise<void> {
    if (!createdCar?.id || !this.permissionService.hasPermission('inventory.view')) return;

    const result = await this.notificationService.confirmAlert(
      this.translate.instant('VEHICLE_LABEL.PRINT_PROMPT_TITLE'),
      this.translate.instant('VEHICLE_LABEL.PRINT_PROMPT_TEXT'),
      this.translate.instant('VEHICLE_LABEL.PRINT_LABEL')
    );

    if (result?.isConfirmed) {
      window.open(`/#/inventory/label/print/${createdCar.id}`, '_blank');
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

  // ── Wizard navigation ────────────────────────────────────────────────────────────────────────
  readonly stepCount = this.stepFieldNames.length + 1; // +1 for the Review step

  goNext(): void {
    if (!this.stepValid()) {
      this.markStepTouched(this.currentStep());
      return;
    }
    if (this.currentStep() < this.stepCount - 1) {
      this.currentStep.update(i => i + 1);
    }
  }

  goBack(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(i => i - 1);
    }
  }

  goToStep(index: number): void {
    if (index === this.currentStep()) return;
    // Only allow jumping forward past a step that's already valid, mirroring the linear-stepper
    // behavior this replaces; jumping backward is always allowed.
    if (index > this.currentStep()) {
      for (let i = this.currentStep(); i < index; i++) {
        if (!this.isStepValidIndex(i)) {
          this.markStepTouched(i);
          return;
        }
      }
    }
    this.currentStep.set(index);
  }

  isStepReachable(index: number): boolean {
    for (let i = 0; i < index; i++) {
      if (!this.isStepValidIndex(i)) return false;
    }
    return true;
  }

  private isStepValidIndex(index: number): boolean {
    const fields = this.stepFieldNames[index] ?? [];
    return fields.every(name => {
      const control = this.carForm?.get(name);
      return !control || control.valid;
    });
  }

  private markStepTouched(index: number): void {
    const fields = this.stepFieldNames[index] ?? [];
    fields.forEach(name => this.carForm?.get(name)?.markAsTouched());
  }
}
