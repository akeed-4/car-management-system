import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

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
  
  // بناء النموذج
  financingForm = this.fb.group({
    carId: [null, Validators.required],
    financierId: [null, Validators.required],
    financedAmount: [0, [Validators.required, Validators.min(1)]],
    startDate: [new Date().toISOString().substring(0, 10), Validators.required],
    annualInterestRate: [0, [Validators.required, Validators.min(0)]],
    gracePeriodDays: [0]
  });

  save() {
    if (this.financingForm.valid) {
      console.log('Saving Floor Plan:', this.financingForm.value);
      // هنا تستدعي الخدمة لحفظ البيانات في قاعدة البيانات
      // this.floorPlanService.save(this.financingForm.value).subscribe(...);
    }
  }
}
