import { Component, inject, signal, computed } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-car-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './car-selection-dialog.component.html',
  styleUrl: './car-selection-dialog.component.css'
})
export class CarSelectionDialogComponent {
  dialogRef = inject(MatDialogRef<CarSelectionDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  searchTerm = signal('');

  filteredCars = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.data.cars.filter((car: any) => car.carName.toLowerCase().includes(term));
  });

  selectCar(car: any) {
    this.dialogRef.close(car);
  }

  close() {
    this.dialogRef.close();
  }
}