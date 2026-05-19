import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FloorPlanService } from '@/src/services/floor-plan.service';

@Component({
  selector: 'app-floor-plan-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './floor-plan-form.component.html',
  styleUrl: './floor-plan-form.component.css'
})
export class FloorPlanFormComponent {
  private fb = inject(FormBuilder);
  private floorPlanService: FloorPlanService = inject(FloorPlanService);
  private dialog = inject(MatDialog);

  selectedVehicle = signal<any | null>(null);
  
  // بناء النموذج
  financingForm = this.fb.group({
    carId: [null, Validators.required],
    financierId: [null, Validators.required],
    financedAmount: [0, [Validators.required, Validators.min(1)]],
    startDate: [new Date().toISOString().substring(0, 10), Validators.required],
    annualInterestRate: [0, [Validators.required, Validators.min(0)]],
    gracePeriodDays: [0]
  });

  openCarSelectionDialog() {
    import('../../sales/car-selection-dialog/car-selection-dialog.component').then(({ CarSelectionDialogComponent }) => {
      const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
        width: '900px',
        data: {},
        autoFocus: true,
        disableClose: false
      });
      dialogRef.afterClosed().subscribe((selectedCar: any) => {
        if (selectedCar && selectedCar.id) {
          this.financingForm.patchValue({ carId: selectedCar.id });
          this.selectedVehicle.set(selectedCar);
        }
      });
    });
  }

  getVehicleLabel(vehicle: any): string {
    if (!vehicle) return '';
    return `${vehicle.plateNumber || '-'} - ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.year || ''}`;
  }

  save() {
    if (this.financingForm.valid) {
      const value = this.financingForm.value;
      // If there is an id, update; otherwise, create
      if ((value as any).id) {
        this.floorPlanService.updateFloorPlan(value as any);
      } else {
        this.floorPlanService.addFloorPlan({
          carId: value.carId!,
          financierId: value.financierId!,
          financedAmount: value.financedAmount!,
          startDate: value.startDate!,
          annualInterestRate: value.annualInterestRate!,
          gracePeriodDays: value.gracePeriodDays ?? 0
        });
      }
    }
  }
}
