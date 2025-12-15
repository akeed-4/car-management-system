import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CostCenterService } from '../../../../services/cost-center.service';
import { InventoryService } from '../../../../services/inventory.service';
import { CreateCostCenterDto, UpdateCostCenterDto, CostCenter } from '../../../../types/cost-center.model';
import { Car } from '../../../../types/car.model';

@Component({
  selector: 'app-cost-center-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './cost-center-form.component.html',
  styleUrls: ['./cost-center-form.component.css']
})
export class CostCenterFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private costCenterService = inject(CostCenterService);
  private inventoryService = inject(InventoryService);
  public translate = inject(TranslateService);

  costCenterForm!: FormGroup;
  isEditMode = false;
  costCenterId?: number;
  cars: Car[] = [];
  parentCostCenters: CostCenter[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.initForm();
    this.loadCars();
    this.loadParentCostCenters();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.costCenterId = +params['id'];
        this.isEditMode = true;
        this.loadCostCenter(this.costCenterId);
      }
    });
  }

  initForm(): void {
    this.costCenterForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      nameAr: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(500)],
      carId: [null],
      parentId: [null],
      isActive: [true]
    });
  }

  loadCars(): void {
    this.inventoryService.getCars().subscribe({
      next: () => {
        this.cars = this.inventoryService.cars$();
      },
      error: (error) => {
        console.error('Error loading cars:', error);
      }
    });
  }

  loadParentCostCenters(): void {
    this.costCenterService.getCostCenters().subscribe({
      next: (centers) => {
        this.parentCostCenters = centers.filter(c => !this.costCenterId || c.id !== this.costCenterId);
      },
      error: (error) => {
        console.error('Error loading parent cost centers:', error);
      }
    });
  }

  loadCostCenter(id: number): void {
    this.isLoading = true;
    this.costCenterService.getCostCenterById(id).subscribe({
      next: (costCenter) => {
        if (costCenter) {
          this.costCenterForm.patchValue({
            code: costCenter.code,
            name: costCenter.name,
            nameAr: costCenter.nameAr,
            description: costCenter.description || '',
            carId: costCenter.carId,
            parentId: costCenter.parentId,
            isActive: costCenter.isActive
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cost center:', error);
        this.isLoading = false;
      }
    });
  }

  onCarSelected(carId: number): void {
    const selectedCar = this.cars.find(c => c.id === carId);
    if (selectedCar) {
      // Auto-fill code and name based on car
      const code = `CC-CAR-${selectedCar.vin?.substring(0, 8) || carId}`;
      const name = `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`;
      
      this.costCenterForm.patchValue({
        code: code,
        name: name
      });
    }
  }

  onSubmit(): void {
    if (this.costCenterForm.valid) {
      this.isLoading = true;
      
      if (this.isEditMode && this.costCenterId) {
        const updateDto: UpdateCostCenterDto = {
          id: this.costCenterId,
          ...this.costCenterForm.value
        };
        
        this.costCenterService.updateCostCenter(updateDto).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/cost-centers']);
          },
          error: (error) => {
            console.error('Error updating cost center:', error);
            this.isLoading = false;
          }
        });
      } else {
        const createDto: CreateCostCenterDto = this.costCenterForm.value;
        
        this.costCenterService.createCostCenter(createDto).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/cost-centers']);
          },
          error: (error) => {
            console.error('Error creating cost center:', error);
            this.isLoading = false;
          }
        });
      }
    } else {
      Object.keys(this.costCenterForm.controls).forEach(key => {
        this.costCenterForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/cost-centers']);
  }

  getCarDisplay(car: Car): string {
    return `${car.year} ${car.make} ${car.model} (${car.vin})`;
  }
}
