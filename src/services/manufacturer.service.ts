import { Injectable, signal } from '@angular/core';
import { Manufacturer } from '../types/manufacturer.model';

@Injectable({
  providedIn: 'root',
})
export class ManufacturerService {
  private nextId = signal(6);
  private manufacturers = signal<Manufacturer[]>([
    { id: 1, name: 'Toyota' },
    { id: 2, name: 'Ford' },
    { id: 3, name: 'BMW' },
    { id: 4, name: 'Hyundai' },
    { id: 5, name: 'Mercedes-Benz' },
  ]);

  public manufacturers$ = this.manufacturers.asReadonly();

  addManufacturer(manufacturer: Omit<Manufacturer, 'id'>) {
    const newManufacturer: Manufacturer = {
      ...manufacturer,
      id: this.nextId(),
    };
    this.manufacturers.update(manufacturers => [...manufacturers, newManufacturer]);
    this.nextId.update(id => id + 1);
  }

  deleteManufacturer(id: number) {
    this.manufacturers.update(manufacturers => manufacturers.filter(m => m.id !== id));
  }
}