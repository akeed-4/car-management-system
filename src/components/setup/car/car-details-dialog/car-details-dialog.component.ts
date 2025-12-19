import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Car } from '../../../../types/car.model';

@Component({
  selector: 'app-car-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './car-details-dialog.component.html',
  styleUrls: ['./car-details-dialog.component.css']
})
export class CarDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CarDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Car
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Available':
        return 'primary';
      case 'Sold':
        return 'warn';
      case 'Reserved':
        return 'accent';
      case 'In Maintenance':
        return 'basic';
      default:
        return 'basic';
    }
  }

  getFahasStatusColor(status: string): string {
    switch (status) {
      case 'Valid':
        return 'primary';
      case 'Expired':
        return 'warn';
      case 'Not Required':
        return 'accent';
      default:
        return 'basic';
    }
  }
}