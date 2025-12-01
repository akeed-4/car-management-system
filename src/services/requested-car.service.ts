import { Injectable, signal } from '@angular/core';
import { RequestedCar } from '../types/requested-car.model';

@Injectable({
  providedIn: 'root',
})
export class RequestedCarService {
  private nextId = signal(3);
  private requestedCars = signal<RequestedCar[]>([
    {
      id: 1,
      requestDate: '2024-05-22',
      customerName: 'محمد عبدالله',
      customerPhone: '0512345678',
      make: 'Mercedes-Benz',
      model: 'G-Class',
      year: 2024,
      color: 'أسود',
      notes: 'يفضل أن تكون بحالة جديدة تماماً.',
      status: 'New',
      isArchived: false,
    },
    {
      id: 2,
      requestDate: '2024-05-20',
      customerName: 'سارة خالد',
      customerPhone: '0587654321',
      make: 'Toyota',
      model: 'Land Cruiser',
      year: 2023,
      color: 'أبيض لؤلؤي',
      notes: 'تم التواصل مع العميل، يبحث عن فئة VXR.',
      status: 'Contacted',
      isArchived: false,
    },
  ]);

  public requestedCars$ = this.requestedCars.asReadonly();

  getRequestById(id: number): RequestedCar | undefined {
    return this.requestedCars().find(r => r.id === id);
  }

  addRequest(request: Omit<RequestedCar, 'id'>) {
    const newRequest: RequestedCar = {
      ...request,
      id: this.nextId(),
      isArchived: false,
    };
    this.requestedCars.update(requests => [...requests, newRequest]);
    this.nextId.update(id => id + 1);
  }

  updateRequest(updatedRequest: RequestedCar) {
    this.requestedCars.update(requests =>
      requests.map(r => (r.id === updatedRequest.id ? updatedRequest : r))
    );
  }

  deleteRequest(id: number) {
    this.requestedCars.update(requests => requests.filter(r => r.id !== id));
  }
  
  archiveRequest(id: number) {
    this.requestedCars.update(requests =>
      requests.map(req => (req.id === id ? { ...req, isArchived: true } : req))
    );
  }

  unarchiveRequest(id: number) {
    this.requestedCars.update(requests =>
      requests.map(req => (req.id === id ? { ...req, isArchived: false } : req))
    );
  }
}