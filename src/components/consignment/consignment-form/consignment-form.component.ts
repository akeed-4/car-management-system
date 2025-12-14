
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConsignmentService } from '../../../services/consignment.service';
import { ConsignmentCar } from '../../../types/consignment-car.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { matTooltipAnimations, MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-consignment-form',
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
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './consignment-form.component.html',
  styleUrl: './consignment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsignmentFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consignmentService = inject(ConsignmentService);

  consignmentForm!: FormGroup;
  editMode = signal(false);
  pageTitle = signal('إضافة سيارة للعهدة');

  ngOnInit() {
    this.initForm();
    
    // Handle route params for editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات سيارة العهدة');
      this.consignmentService.getById(id).subscribe(existingCar => {
        this.consignmentForm.patchValue(existingCar);
      }, error => {
        console.error('Error loading consignment car:', error);
        this.router.navigate(['/consignment-cars']);
      });
    }
  }

  private initForm() {
    this.consignmentForm = new FormGroup({
      ownerName: new FormControl('', Validators.required),
      ownerPhone: new FormControl('', Validators.required),
      make: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      year: new FormControl(null, Validators.required),
      exteriorColor: new FormControl(''),
      mileage: new FormControl(null),
      plateNumber: new FormControl(''),
      vin: new FormControl(''),
      agreedSalePrice: new FormControl(null, Validators.required),
      commissionRate: new FormControl(0.05, Validators.required),
      dateReceived: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      notes: new FormControl('')
    });
  }

  saveConsignmentCar() {
    if (this.consignmentForm.invalid) {
      return;
    }

    const formValue = this.consignmentForm.value;
    const carToSave = {
      ...formValue,
      status: 'Available' as const
    };

    if (this.editMode()) {
      this.consignmentService.updateConsignmentCar(carToSave as ConsignmentCar);
    } else {
      const { id, ...newCar } = carToSave;
      this.consignmentService.addConsignmentCar(newCar as Omit<ConsignmentCar, 'id'>);
    }
    alert('تم حفظ بيانات سيارة العهدة بنجاح.');
    this.router.navigate(['/consignment-cars']);
  }
}
