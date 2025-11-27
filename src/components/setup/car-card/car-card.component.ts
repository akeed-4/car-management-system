import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Car } from '../../../types/car.model';

@Component({
  selector: 'app-car-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './car-card.component.html',
  styleUrl: './car-card.component.css'
})
export class CarCardComponent {
  car = input.required<Car>();
  
  // Output events
  edit = output<number>();
  delete = output<number>();
  view = output<number>();

  onEdit() {
    this.edit.emit(this.car().id);
  }

  onDelete() {
    this.delete.emit(this.car().id);
  }

  onView() {
    this.view.emit(this.car().id);
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'available': 'متاح',
      'sold': 'مباع',
      'reserved': 'محجوز',
      'maintenance': 'صيانة'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'available': 'bg-green-100 text-green-800',
      'sold': 'bg-red-100 text-red-800',
      'reserved': 'bg-yellow-100 text-yellow-800',
      'maintenance': 'bg-blue-100 text-blue-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }
}
