import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { Car, CarStatus } from '../../../types/car.model';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../../services/gemini.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CarModelService } from '../../../services/car-model.service';
import { ManufactureYearService } from '../../../services/manufacture-year.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  // private geminiService = inject(GeminiService);
  private manufacturerService = inject(ManufacturerService);
  private carModelService = inject(CarModelService);
  private yearService = inject(ManufactureYearService);

  // Signals for dropdowns
  manufacturers = this.manufacturerService.manufacturers$;
  allModels = this.carModelService.carModels$;
  years = this.yearService.years$;

  car = signal<Partial<Car>>({
    status: 'Available',
    photos: ['https://picsum.photos/800/600?random=10'],
    purchasePrice: 0,
    additionalCosts: 0,
    salePrice: 0,
    mileage: 0,
  });
  
  editMode = signal(false);
  pageTitle = signal('إضافة سيارة جديدة');

  isGenerating = signal(false);
  generationError = signal<string | null>(null);

  // Computed signal for filtered models
  filteredModels = computed(() => {
    const carMake = this.car().make;
    const selectedManufacturer = this.manufacturers().find(m => m.name === carMake);
    if (!selectedManufacturer) {
      return [];
    }
    return this.allModels().filter(m => m.manufacturerId === selectedManufacturer.id);
  });

  canGenerateDescription = computed(() => {
    const c = this.car();
    return c.make && c.model && c.year;
  });

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات السيارة');
        const existingCar = this.inventoryService.getCarById(id);
        if (existingCar) {
          this.car.set({ ...existingCar });
        } else {
          this.router.navigate(['/inventory']);
        }
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

  saveCar() {
    const carToSave = this.car() as Car;
    if (this.editMode()) {
        this.inventoryService.updateCar(carToSave);
    } else {
        const { id, totalCost, ...newCar } = carToSave;
        this.inventoryService.addCar(newCar);
    }
    this.router.navigate(['/inventory']);
  }
  
  async generateDescription() {
    if (!this.canGenerateDescription()) {
      this.generationError.set('Please fill in Make, Model, and Year before generating a description.');
      return;
    }
    this.isGenerating.set(true);
    this.generationError.set(null);
    const carDetails = this.car();
    const promptDetails = `Make: ${carDetails.make}, Model: ${carDetails.model}, Year: ${carDetails.year}, Color: ${carDetails.exteriorColor}, Mileage: ${carDetails.mileage}km, Engine: ${carDetails.engineSize}, Transmission: ${carDetails.transmission}.`;

    try {
        // const description = await this.geminiService.generateCarDescription(promptDetails);
        // this.updateCarField('description', description);
    } catch (error) {
        this.generationError.set(typeof error === 'string' ? error : 'An unknown error occurred.');
    } finally {
        this.isGenerating.set(false);
    }
  }

}