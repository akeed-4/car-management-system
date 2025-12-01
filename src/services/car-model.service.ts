import { Injectable, signal } from '@angular/core';
import { CarModel } from '../types/car-model.model';

@Injectable({
  providedIn: 'root',
})
export class CarModelService {
  private nextId = signal(7);
  private carModels = signal<CarModel[]>([
    { id: 1, name: 'Camry', manufacturerId: 1, manufacturerName: 'Toyota' },
    { id: 2, name: 'Corolla', manufacturerId: 1, manufacturerName: 'Toyota' },
    { id: 3, name: 'Explorer', manufacturerId: 2, manufacturerName: 'Ford' },
    { id: 4, name: 'Mustang', manufacturerId: 2, manufacturerName: 'Ford' },
    { id: 5, name: 'X5', manufacturerId: 3, manufacturerName: 'BMW' },
    { id: 6, name: 'Elantra', manufacturerId: 4, manufacturerName: 'Hyundai' },
  ]);

  public carModels$ = this.carModels.asReadonly();

  addCarModel(model: Omit<CarModel, 'id'>) {
    const newModel: CarModel = {
      ...model,
      id: this.nextId(),
    };
    this.carModels.update(models => [...models, newModel]);
    this.nextId.update(id => id + 1);
  }

  deleteCarModel(id: number) {
    this.carModels.update(models => models.filter(m => m.id !== id));
  }
}