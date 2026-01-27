import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestedCar } from '../../../models/requested-car.model';
import { RequestedCarService } from '../../../services/requested-car.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CarModelService } from '../../../services/car-model.service';
import { ManufactureYearService } from '../../../services/manufacture-year.service';
import { CustomerService } from '../../../services/customer.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-requested-car-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './requested-car-form.component.html',
  styleUrl: './requested-car-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestedCarFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private requestedCarService = inject(RequestedCarService);
  private manufacturerService = inject(ManufacturerService);
  private carModelService = inject(CarModelService);
  private yearService = inject(ManufactureYearService);
  private customerService = inject(CustomerService);

  requestForm!: FormGroup;
  editMode = signal(false);
  pageTitle = signal('إضافة طلب سيارة جديدة');
  
  // Data for dropdowns
  manufacturers = this.manufacturerService.manufacturers$;
  allModels = toSignal(this.carModelService.getCarModels(), { initialValue: [] });
  years = this.yearService.years$;
  customers = this.customerService.customers$;

  // Computed signal for filtered models
  filteredModels = computed(() => {
    const carMake = this.requestForm?.get('make')?.value;
    const selectedManufacturer = this.manufacturers().find(m => m.name === carMake);
    if (!selectedManufacturer) {
      return [];
    }
    return this.allModels().filter(m => m.manufacturerId === selectedManufacturer.id);
  });

  ngOnInit() {
    this.initForm();
    
    // Handle route params for editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل طلب سيارة');
      this.requestedCarService.getRequestById(id).subscribe({
        next: (existingRequest) => {
          // Find customer by name to set customerId
          const customer = this.customers().find(c => c.name === existingRequest.customerName);
          this.requestForm.patchValue({
            ...existingRequest,
            customerId: customer?.id || null
          });
        },
        error: () => {
          this.router.navigate(['/requested-cars']);
        }
      });
    }
  }

  private initForm() {
    this.requestForm = new FormGroup({
      customerId: new FormControl(null, Validators.required),
      customerName: new FormControl('', Validators.required),
      customerPhone: new FormControl('', Validators.required),
      make: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      year: new FormControl(null),
      color: new FormControl(''),
      status: new FormControl('New', Validators.required),
      notes: new FormControl(''),
      requestDate: new FormControl(new Date().toISOString().split('T')[0])
    });
  }
  
  updateRequestField<K extends keyof RequestedCar>(field: K, value: RequestedCar[K]) {
    this.requestForm.patchValue({ [field]: value });
    // When make changes, reset model
    if (field === 'make') {
      this.requestForm.patchValue({ model: undefined });
    }
  }

  saveRequest() {
    if (this.requestForm.invalid) {
      return;
    }

    const requestData = this.requestForm.value;
    if (this.editMode()) {
        this.requestedCarService.updateRequest(requestData as RequestedCar);
    } else {
        const { id, ...newRequest } = requestData;
        this.requestedCarService.addRequest(newRequest as Omit<RequestedCar, 'id'>);
    }
    this.router.navigate(['/requested-cars']);
  }

  onCustomerChange(customerId: number) {
    const selectedCustomer = this.customers().find(c => c.id === customerId);
    if (selectedCustomer) {
      this.requestForm.patchValue({
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone || ''
      });
    }
  }

  trackByManufacturer(index: number, manufacturer: any): any {
    return manufacturer.id;
  }

  trackByModel(index: number, model: any): any {
    return model.id;
  }

  trackByYear(index: number, year: number): number {
    return year;
  }

  trackByCustomer(index: number, customer: any): any {
    return customer.id;
  }
}
