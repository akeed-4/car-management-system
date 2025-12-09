
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { Car, CarCondition, CarStatus, CarLocation } from '../../../types/car.model';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { GeminiService } from '../../../services/gemini.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CarModelService } from '../../../services/car-model.service';
import { ManufactureYearService } from '../../../services/manufacture-year.service';
import { VinScannerComponent } from '../../shared/vin-scanner/vin-scanner.component';
import { PublishModalComponent } from '../../shared/publish-modal/publish-modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { FloorPlanService } from '../../../services/floor-plan.service';
import { ExpenseService } from '../../../services/expense.service';
import { PriceSuggestion } from '../../../types/price-suggestion.model';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, VinScannerComponent, PublishModalComponent, TranslateModule],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private geminiService = inject(GeminiService);
  private manufacturerService = inject(ManufacturerService);
  private carModelService = inject(CarModelService);
  private yearService = inject(ManufactureYearService);
  private floorPlanService = inject(FloorPlanService);
  private expenseService = inject(ExpenseService);

  // Signals for dropdowns
  manufacturers = this.manufacturerService.manufacturers$;
  allModels = toSignal(this.carModelService.getCarModels(), { initialValue: [] });
  years = this.yearService.years$;
  floorPlans = this.floorPlanService.floorPlans$;

  car = signal<Partial<Car>>({
    status: 'Available',
    currentLocation: 'In Showroom',
    photos: ['https://picsum.photos/800/600?random=10'],
    purchasePrice: 0,
    additionalCosts: 0,
    totalCost: 0,
    salePrice: 0,
    condition: 'Used',
    mileage: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  
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
    const carId = this.car()?.id;
    if (!carId) return [];
    return this.allExpenses().filter(e => e.carId === carId);
  });
  calculatedTotalCost = computed(() => {
    const c = this.car();
    const associatedCost = this.associatedExpenses().reduce((sum, exp) => sum + exp.amount, 0);
    return (c.purchasePrice ?? 0) + (c.additionalCosts ?? 0) + associatedCost;
  });

  // Computed signal for filtered models
  filteredModels = computed(() => {
    const carMake = this.car().make;
    const selectedManufacturer = this.manufacturers().find(m => m.name === carMake);
    if (!selectedManufacturer) {
      return [];
    }
    return this.allModels().filter(m => m.manufacturerId === selectedManufacturer.id);
  });

  canSuggestPrice = computed(() => {
    const c = this.car();
    return c.make && c.model && c.year && c.mileage;
  });

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات السيارة');
        this.inventoryService.getCarById(id).subscribe(existingCar => {
          this.car.set({ ...existingCar });
        }, error => {
          console.error('Error loading car:', error);
          this.router.navigate(['/inventory']);
        });
      }
    });
  }

  updateCarField<K extends keyof Car>(field: K, value: Car[K]) {
    this.car.update(c => {
      const updatedCar: Partial<Car> = { ...c, [field]: value };
      // When make changes, reset model
      if (field === 'make') {
        updatedCar.model = undefined;
      }
      return updatedCar;
    });
  }
  
  onConditionChange(condition: CarCondition) {
    this.car.update(c => {
      const updatedCar = { ...c, condition };
      if (condition === 'New') {
        updatedCar.mileage = 0;
      }
      return updatedCar;
    });
  }

  onVinScanned(vin: string) {
    this.updateCarField('vin', vin);
    this.isScannerOpen.set(false);
  }

  saveCar() {
    const carToSave = {
      ...this.car(),
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

    const carDetails = this.car();
    try {
      const suggestion = await this.geminiService.suggestPrice(carDetails);
      this.priceSuggestion.set(suggestion);
      // Automatically apply the average price
      this.updateCarField('salePrice', suggestion.average);
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

  navigateToDepositForm() {
    const carId = this.car().id;
    if (carId) {
      this.router.navigate(['/accounts/deposits/new', carId]);
    }
  }

}
