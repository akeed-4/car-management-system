import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestedCar } from '../../../types/requested-car.model';
import { RequestedCarService } from '../../../services/requested-car.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CarModelService } from '../../../services/car-model.service';
import { ManufactureYearService } from '../../../services/manufacture-year.service';

@Component({
  selector: 'app-requested-car-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './requested-car-form.component.html',
  styleUrl: './requested-car-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestedCarFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private requestedCarService = inject(RequestedCarService);
  private manufacturerService = inject(ManufacturerService);
  private carModelService = inject(CarModelService);
  private yearService = inject(ManufactureYearService);

  request = signal<Partial<RequestedCar>>({
    status: 'New',
    requestDate: new Date().toISOString().split('T')[0],
  });
  editMode = signal(false);
  pageTitle = signal('إضافة طلب سيارة جديدة');
  
  // Data for dropdowns
  manufacturers = this.manufacturerService.manufacturers$;
  allModels = this.carModelService.carModels$;
  years = this.yearService.years$;

  // Computed signal for filtered models
  filteredModels = computed(() => {
    const carMake = this.request().make;
    const selectedManufacturer = this.manufacturers().find(m => m.name === carMake);
    if (!selectedManufacturer) {
      return [];
    }
    return this.allModels().filter(m => m.manufacturerId === selectedManufacturer.id);
  });

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل طلب سيارة');
        const existingRequest = this.requestedCarService.getRequestById(id);
        if (existingRequest) {
          this.request.set({ ...existingRequest });
        } else {
          this.router.navigate(['/requested-cars']);
        }
      }
    });
  }
  
  updateRequestField<K extends keyof RequestedCar>(field: K, value: RequestedCar[K]) {
    this.request.update(r => {
      const updatedRequest: Partial<RequestedCar> = { ...r, [field]: value };
      // When make changes, reset model
      if (field === 'make') {
        updatedRequest.model = undefined;
      }
      return updatedRequest;
    });
  }

  saveRequest() {
    const requestData = this.request();
    if (this.editMode()) {
        this.requestedCarService.updateRequest(requestData as RequestedCar);
    } else {
        const { id, ...newRequest } = requestData;
        this.requestedCarService.addRequest(newRequest as Omit<RequestedCar, 'id'>);
    }
    this.router.navigate(['/requested-cars']);
  }
}
