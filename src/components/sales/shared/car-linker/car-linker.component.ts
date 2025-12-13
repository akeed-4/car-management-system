import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-car-linker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './car-linker.component.html',
  styleUrls: ['./car-linker.component.css']
})
export class CarLinkerComponent {
  @Input() chassisNumberControl!: FormControl<string | null>;
  @Input() plateNumberControl!: FormControl<string | null>;
  @Output() linkCar = new EventEmitter<{ chassisNumber?: string; plateNumber?: string }>();

  linkCarToCustomer(): void {
    if (this.chassisNumberControl.value || this.plateNumberControl.value) {
      this.linkCar.emit({
        chassisNumber: this.chassisNumberControl.value || undefined,
        plateNumber: this.plateNumberControl.value || undefined
      });
    }
  }
}