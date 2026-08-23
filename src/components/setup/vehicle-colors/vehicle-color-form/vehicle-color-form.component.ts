import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VehicleColorService } from '../../../../services/vehicle-color.service';
import { VehicleColor } from '../../../../models/vehicle-color.model';
import { NotificationService } from '@/src/services/notification.service';

/**
 * Requirement 8: quick-add form for the VehicleColor dictionary, opened as a MatDialog from
 * CarCardComponent's Exterior/Interior Color "+" buttons -- same reuse pattern as
 * ManufacturersComponent/CarModelsComponent/CarCategoryFormComponent (see their
 * @Optional() MatDialogRef support). There is no routed "manage colors" page yet, so this
 * component is dialog-only for now.
 */
@Component({
  selector: 'app-vehicle-color-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './vehicle-color-form.component.html',
  styleUrl: './vehicle-color-form.component.css'
})
export class VehicleColorFormComponent {
  private fb = inject(FormBuilder);
  private vehicleColorService = inject(VehicleColorService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private dialogRef = inject(MatDialogRef<VehicleColorFormComponent, VehicleColor | undefined>, { optional: true });

  colorForm: FormGroup = this.fb.group({
    nameAr: ['', Validators.required],
    nameEn: ['', Validators.required],
    isActive: [true]
  });

  isSaving = false;

  save(): void {
    if (this.colorForm.invalid) {
      this.colorForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.vehicleColorService.create(this.colorForm.value).subscribe({
      next: (created) => {
        this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
        this.isSaving = false;
        this.dialogRef?.close(created);
      },
      error: (error) => {
        console.error('Error creating vehicle color', error);
        this.notificationService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.dialogRef?.close();
  }
}
