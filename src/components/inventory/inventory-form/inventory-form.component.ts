
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { Car, CarCondition, CarStatus, CarLocation } from '../../../models/car.model';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, JsonPipe, CommonModule } from '@angular/common';
import { GeminiService } from '../../../services/gemini.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CarModelService } from '../../../services/car-model.service';
import { ManufactureYearService } from '../../../services/manufacture-year.service';
import { VinScannerComponent } from '../../shared/vin-scanner/vin-scanner.component';
import { PublishModalComponent } from '../../shared/publish-modal/publish-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { FloorPlanService } from '../../../services/floor-plan.service';
import { ExpenseService } from '../../../services/expense.service';
import { PriceSuggestion } from '../../../models/price-suggestion.model';
import { Expense } from '../../../models/expense.model';
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
import { DxDataGridModule } from 'devextreme-angular';
import { CarCategoryService } from '../../../services/car-category.service';
import { CarCategory } from '../../../types/car-category.model';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    CommonModule,
    VinScannerComponent,
    PublishModalComponent,
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
    DxDataGridModule
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

  carForm!: FormGroup;

  // Signals for dropdowns
  manufacturers = this.manufacturerService.manufacturers$;
  allModels = toSignal(this.carModelService.getCarModels(), { initialValue: [] });
  years = this.yearService.years$;
  floorPlans = this.floorPlanService.floorPlans$;

  // Table columns for expenses
  displayedColumns = ['date', 'description', 'amount'];
  
  editMode = signal(false);
  pageTitle = signal('إضافة سيارة جديدة');

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
    const carId = this.carForm?.get('id')?.value;
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
    const carMake = this.carForm?.get('make')?.value;
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

  ngOnInit() {
    this.initForm();
    
    // Handle route params for editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات السيارة');
      this.inventoryService.getCarById(id).subscribe(existingCar => {
        this.carForm.patchValue(existingCar);
      }, error => {
        console.error('Error loading car:', error);
        this.router.navigate(['/inventory']);
      });
    }
  }

  private initForm() {
    this.carForm = new FormGroup({
      make: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      year: new FormControl(null, Validators.required),
      vin: new FormControl(''),
      plateNumber: new FormControl(''),
      istimaraExpiry: new FormControl(''),
      fahasStatus: new FormControl('Valid'),
      mileage: new FormControl(0, Validators.required),
      condition: new FormControl('Used', Validators.required),
      exteriorColor: new FormControl(''),
      interiorColor: new FormControl(''),
      engineCapacity: new FormControl(''),
      fuelType: new FormControl(''),
      transmission: new FormControl(''),
      driveType: new FormControl(''),
      bodyType: new FormControl(''),
      purchasePrice: new FormControl(0, [Validators.required, Validators.min(0)]),
      additionalCosts: new FormControl(0, Validators.min(0)),
      purchaseDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      salePrice: new FormControl(0, Validators.min(0)),
      calculateVATFromProfitMargin: new FormControl(false),
      trackByBatch: new FormControl(false),
      description: new FormControl(''),
      photos: new FormControl(['https://picsum.photos/800/600?random=10']),
      status: new FormControl('Available'),
      currentLocation: new FormControl('In Showroom'),
      floorPlanId: new FormControl(null)
    });
  }

  updateCarField<K extends keyof Car>(field: K, value: Car[K]) {
    this.carForm.patchValue({ [field]: value });
    // When make changes, reset model
    if (field === 'make') {
      this.carForm.patchValue({ model: undefined });
    }
  }
  
  onConditionChange(condition: CarCondition) {
    this.carForm.patchValue({ condition });
    if (condition === 'New') {
      this.carForm.patchValue({ mileage: 0 });
    }
  }

  onVinScanned(vin: string) {
    this.carForm.patchValue({ vin });
    this.isScannerOpen.set(false);
  }

  saveCar() {
    if (this.carForm.invalid) {
      return;
    }

    const formValue = this.carForm.value;
    const carToSave = {
      ...formValue,
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
  
  async suggestPrice() {
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

  applySuggestedPrice(price: number) {
    this.updateCarField('salePrice', price);
  }

  addExpense() {
    // This method would add an expense to the associated expenses
    // Implementation depends on how expenses are managed
  }

  removeExpense(expenseId: string) {
    // This method would remove an expense from the associated expenses
    // Implementation depends on how expenses are managed
  }

  updateExpense<K extends keyof Expense>(expenseId: string, field: K, value: Expense[K]) {
    // This method would update an expense in the associated expenses
    // Implementation depends on how expenses are managed
  }

  calculateAmountCellValue(rowData: any) {
    return rowData.amount;
  }

  resetForm() {
    this.carForm.reset();
    this.priceSuggestion.set(null);
    this.priceSuggestionError.set(null);
    this.isScannerOpen.set(false);
    this.isSuggestingPrice.set(false);
  }

  navigateToDepositForm() {
    const carId = this.carForm.get('id')?.value;
    if (carId) {
      this.router.navigate(['/accounts/deposits/new', carId]);
    }
  }

}
