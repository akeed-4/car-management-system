import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { RetailService } from '../../../../../services/retail.service';
import { Car } from '../../../../../models/car.model';

@Component({
  selector: 'app-inventory-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './inventory-selector.component.html',
  styleUrls: ['./inventory-selector.component.css']
})
export class InventorySelectorComponent implements OnInit {
  @Output() carSelected = new EventEmitter<Car | null>();

  availableCars: Car[] = [];
  loading = false;
  selectedCarId: number | null = null;

  constructor(private retailService: RetailService) {}

  ngOnInit(): void {
    this.loading = true;
    this.retailService.getAvailableCars().subscribe({
      next: cars => {
        this.availableCars = cars;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSelectionChange(carId: number): void {
    const car = this.availableCars.find(c => c.id === carId) ?? null;
    this.carSelected.emit(car);
  }
}
