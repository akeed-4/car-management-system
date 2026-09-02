
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { Car, CarCondition } from '../../../models/car.model';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { GeminiService } from '../../../services/gemini.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CarModelService } from '../../../services/car-model.service';
import { ManufactureYearService } from '../../../services/manufacture-year.service';
import { VinScannerComponent } from '../../shared/vin-scanner/vin-scanner.component';
import { TranslateModule } from '@ngx-translate/core';
import { FloorPlanService } from '../../../services/floor-plan.service';
import { ExpenseService } from '../../../services/expense.service';
import { PriceSuggestion } from '../../../models/price-suggestion.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { DxDataGridModule } from 'devextreme-angular';
import { CarCategoryService } from '../../../services/car-category.service';
import { VehicleColorService } from '../../../services/vehicle-color.service';
import { VehicleColor } from '../../../models/vehicle-color.model';
import { StoreService } from '../../../services/store.service';
import { CarStatus } from '../../../models/car.model';
import { AttachmentUploaderComponent } from '../../sales/shared/attachment-uploader/attachment-uploader.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    CommonModule,
    VinScannerComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatTooltipModule,
    MatStepperModule,
    DxDataGridModule,
    AttachmentUploaderComponent,
  ],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private geminiService = inject(GeminiService);
  private manufacturerService = inject(ManufacturerService);
  private carModelService = inject(CarModelService);
  private yearService = inject(ManufactureYearService);
  private floorPlanService = inject(FloorPlanService);
  private expenseService = inject(ExpenseService);
  private carCategoryService = inject(CarCategoryService);
  private vehicleColorService = inject(VehicleColorService);
  private storeService = inject(StoreService);
  private toast = inject(ToastService);

  stepper = viewChild<MatStepper>('stepper');

  // Step 1 -- Basic Info
  basicInfoForm!: FormGroup;
  // Step 2 -- Specifications & Media
  specsForm!: FormGroup;
  // Step 3 -- Financial
  financialForm!: FormGroup;

  // Signals for dropdowns
  manufacturers = this.manufacturerService.manufacturers$;
  allModels = toSignal(this.carModelService.getCarModels(), { initialValue: [] });
  years = this.yearService.years$;
  floorPlans = this.floorPlanService.floorPlans$;
  categories = this.carCategoryService.categories$;
  activeColors = toSignal(this.vehicleColorService.getActive(), { initialValue: [] as VehicleColor[] });
  stores = this.storeService.stores$;

  /** Real DTO fields (CreateCarDto.Status/StoreId/InitialQuantity) -- Status already existed but
   *  was never a visible form field (silently defaulted to 'Available'); Store/InitialQuantity are
   *  create-time-only (no Car.StoreId column, consumed once to create a StoreCarStock row), so this
   *  card is hidden entirely in edit mode rather than shown disabled with a stale/misleading value. */
  readonly carStatuses: CarStatus[] = ['Available', 'Reserved', 'Sold', 'In Maintenance', 'Offered'];

  displayedColumns = ['date', 'description', 'amount'];

  editMode = signal(false);
  pageTitle = signal('إضافة سيارة جديدة');

  /** Real car id once Step 1 has been saved (editing an existing car, or after Step 1's
   *  submit creates a new one) -- Step 2's photo/document upload needs this. */
  carId = signal<number | null>(null);

  // AI Price Suggestion State
  isSuggestingPrice = signal(false);
  priceSuggestionError = signal<string | null>(null);
  priceSuggestion = signal<PriceSuggestion | null>(null);

  // VIN Scanner Modal state
  isScannerOpen = signal(false);

  isSavingStep1 = signal(false);
  isSavingStep2 = signal(false);
  isSavingStep3 = signal(false);

  // Profitability Tracking
  private allExpenses = this.expenseService.expenses$;
  associatedExpenses = computed(() => {
    const id = this.carId();
    if (!id) return [];
    return this.allExpenses().filter(e => e.carId === id);
  });

  /** Reactive mirrors of each form's live value -- a plain `formGroup.value` read inside a
   *  computed() is invisible to Angular's change tracking (FormControl isn't a signal), so
   *  filteredModels/calculatedTotalCost/canSuggestPrice previously froze at their initial value
   *  and never updated as the user filled the form. Initialized in ngOnInit once the forms exist. */
  private basicInfoValue = signal<any>({});
  private financialValue = signal<any>({});

  calculatedTotalCost = computed(() => {
    const formValue = this.financialValue();
    const associatedCost = this.associatedExpenses().reduce((sum, exp) => sum + exp.amount, 0);
    return (formValue.purchasePrice ?? 0) + (formValue.additionalCosts ?? 0) + associatedCost;
  });

  // Computed signal for filtered models (Step 1)
  filteredModels = computed(() => {
    const carMake = this.basicInfoValue().make;
    const selectedManufacturer = this.manufacturers().find(m => m.name === carMake);
    if (!selectedManufacturer) {
      return [];
    }
    return this.allModels().filter(m => m.manufacturerId === selectedManufacturer.id);
  });

  canSuggestPrice = computed(() => {
    const basic = this.basicInfoValue();
    return basic.make && basic.model && basic.year && basic.mileage !== null && basic.mileage !== undefined;
  });

  ngOnInit() {
    this.initForms();

    this.basicInfoForm.valueChanges
      .pipe(startWith(this.basicInfoForm.value))
      .subscribe(value => this.basicInfoValue.set(value));
    this.financialForm.valueChanges
      .pipe(startWith(this.financialForm.value))
      .subscribe(value => this.financialValue.set(value));

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات السيارة');
      this.carId.set(id);
      this.inventoryService.getCarById(id).subscribe(existingCar => {
        this.basicInfoForm.patchValue(existingCar);
        this.specsForm.patchValue(existingCar);
        this.financialForm.patchValue(existingCar);
      }, error => {
        console.error('Error loading car:', error);
        this.router.navigate(['/inventory']);
      });
    }
  }

  private initForms() {
    this.basicInfoForm = new FormGroup({
      make: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      year: new FormControl(null, Validators.required),
      categoryId: new FormControl(null),
      vin: new FormControl(''),
      plateNumber: new FormControl(''),
      istimaraExpiry: new FormControl(''),
      fahasStatus: new FormControl('Valid'),
      mileage: new FormControl(0, Validators.required),
      condition: new FormControl('Used', Validators.required),
      exteriorColorId: new FormControl(null),
      interiorColorId: new FormControl(null),
      status: new FormControl<CarStatus>('Available', Validators.required),
      storeId: new FormControl<number | null>(null),
      initialQuantity: new FormControl<number | null>(1, [Validators.min(1)]),
    });

    this.specsForm = new FormGroup({
      transmission: new FormControl(''),
      engineCapacity: new FormControl(''),
      fuelType: new FormControl(''),
      driveType: new FormControl(''),
      description: new FormControl(''),
    });

    this.financialForm = new FormGroup({
      purchasePrice: new FormControl(0, [Validators.required, Validators.min(0)]),
      additionalCosts: new FormControl(0, Validators.min(0)),
      purchaseDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      salePrice: new FormControl(0, Validators.min(0)),
      calculateVATFromProfitMargin: new FormControl(false),
      trackByBatch: new FormControl(false),
      floorPlanId: new FormControl(null),
      status: new FormControl('Available'),
    });
  }

  onConditionChange(condition: CarCondition) {
    this.basicInfoForm.patchValue({ condition });
    if (condition === 'New') {
      this.basicInfoForm.patchValue({ mileage: 0 });
    }
  }

  onVinScanned(vin: string) {
    this.basicInfoForm.patchValue({ vin });
    this.isScannerOpen.set(false);
  }

  onMakeChange() {
    this.basicInfoForm.patchValue({ model: undefined });
  }

  /** Step 1 submit: creates the car (or saves Basic Info fields on an existing one) so a real
   *  carId exists before Step 2's attachment uploader needs one. */
  async saveStep1() {
    if (this.basicInfoForm.invalid) {
      this.basicInfoForm.markAllAsTouched();
      return;
    }

    this.isSavingStep1.set(true);
    try {
      if (this.editMode() && this.carId()) {
        // storeId/initialQuantity are create-time-only (no Car.StoreId column -- see the `stores`
        // field's doc comment) and must never be sent on an update.
        const { storeId, initialQuantity, ...rest } = this.basicInfoForm.value;
        const updated = { ...rest, id: this.carId() } as Car;
        await new Promise<void>((resolve, reject) => {
          this.inventoryService.updateCar(updated).subscribe({ next: () => resolve(), error: reject });
        });
      } else {
        const created = await this.inventoryService.addCar(this.basicInfoForm.value as Omit<Car, 'id' | 'totalCost'>);
        this.carId.set(created.id);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات السيارة');
      }
      this.stepper()?.next();
    } catch (error) {
      console.error('Error saving basic info:', error);
      this.toast.showError('INVENTORY.FORM.SAVE_FAILED');
    } finally {
      this.isSavingStep1.set(false);
    }
  }

  saveStep2() {
    const id = this.carId();
    if (!id) return;

    this.isSavingStep2.set(true);
    const updated = { ...this.specsForm.value, id } as Car;
    this.inventoryService.updateCar(updated).subscribe({
      next: () => {
        this.isSavingStep2.set(false);
        this.stepper()?.next();
      },
      error: (error) => {
        console.error('Error saving specs:', error);
        this.toast.showError('INVENTORY.FORM.SAVE_FAILED');
        this.isSavingStep2.set(false);
      },
    });
  }

  saveStep3() {
    const id = this.carId();
    if (!id || this.financialForm.invalid) {
      this.financialForm.markAllAsTouched();
      return;
    }

    this.isSavingStep3.set(true);
    const updated = {
      ...this.financialForm.value,
      id,
      totalCost: this.calculatedTotalCost(),
    } as Car;
    this.inventoryService.updateCar(updated).subscribe({
      next: () => {
        this.isSavingStep3.set(false);
        this.router.navigate(['/inventory']);
      },
      error: (error) => {
        console.error('Error saving financial info:', error);
        this.toast.showError('INVENTORY.FORM.SAVE_FAILED');
        this.isSavingStep3.set(false);
      },
    });
  }

  async suggestPrice() {
    if (!this.canSuggestPrice()) return;

    this.isSuggestingPrice.set(true);
    this.priceSuggestionError.set(null);
    this.priceSuggestion.set(null);

    const carDetails = { ...this.basicInfoForm.value, ...this.specsForm.value, ...this.financialForm.value };
    try {
      const suggestion = await this.geminiService.suggestPrice(carDetails);
      this.priceSuggestion.set(suggestion);
      this.financialForm.patchValue({ salePrice: suggestion.average });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      this.priceSuggestionError.set(errorMessage);
    } finally {
      this.isSuggestingPrice.set(false);
    }
  }

  applySuggestedPrice(price: number) {
    this.financialForm.patchValue({ salePrice: price });
  }

  calculateAmountCellValue(rowData: any) {
    return rowData.amount;
  }

  navigateToDepositForm() {
    const id = this.carId();
    if (id) {
      this.router.navigate(['/accounts/deposits/new', id]);
    }
  }
}
