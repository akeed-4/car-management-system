import { Injectable, signal, inject } from '@angular/core';
import { ConsignmentCar, ConsignmentCarStatus } from '../types/consignment-car.model';
import { SalesService } from './sales.service'; // Potentially link to sales for reporting
import { CustomerService } from './customer.service'; // To select owner if they are a customer

@Injectable({
  providedIn: 'root',
})
export class ConsignmentService {
  private nextId = signal(1);
  // private salesService = inject(SalesService); // Could be used to link to sales

  private consignmentCars = signal<ConsignmentCar[]>([
    {
      id: 1,
      vin: 'CONSIGNMENTVIN001',
      plateNumber: 'ABC 789',
      make: 'Nissan',
      model: 'Sunny',
      year: 2020,
      exteriorColor: 'Silver',
      mileage: 80000,
      ownerName: 'سامي العلي',
      ownerPhone: '0561234567',
      agreedSalePrice: 40000,
      commissionRate: 0.07, // 7%
      status: 'Available',
      dateReceived: '2024-05-10',
      isArchived: false,
    },
  ]);

  public consignmentCars$ = this.consignmentCars.asReadonly();

  getConsignmentCarById(id: number): ConsignmentCar | undefined {
    return this.consignmentCars$().find(c => c.id === id);
  }

  addConsignmentCar(car: Omit<ConsignmentCar, 'id'>) {
    const newCar: ConsignmentCar = {
      ...car,
      id: this.nextId(),
      status: 'Available',
      isArchived: false,
    };
    this.consignmentCars.update(cars => [...cars, newCar]);
    this.nextId.update(id => id + 1);
  }

  updateConsignmentCar(updatedCar: ConsignmentCar) {
    this.consignmentCars.update(cars =>
      cars.map(c => (c.id === updatedCar.id ? updatedCar : c))
    );
  }
  
  sellConsignmentCar(carId: number, salePrice: number) {
    this.consignmentCars.update(cars => 
      cars.map(car => {
        if (car.id === carId) {
          const commissionAmount = salePrice * car.commissionRate;
          const ownerPayout = salePrice - commissionAmount;
          return {
            ...car,
            status: 'Sold',
            dateSold: new Date().toISOString().split('T')[0],
            salePrice: salePrice,
            commissionAmount: commissionAmount,
            ownerPayout: ownerPayout,
          };
        }
        return car;
      })
    );
  }

  // Fix: Added deleteConsignmentCar method to align with UI functionality.
  deleteConsignmentCar(id: number) {
    this.consignmentCars.update(cars => cars.filter(car => car.id !== id));
  }

  archiveConsignmentCar(id: number) {
    this.consignmentCars.update(cars =>
      cars.map(car => (car.id === id ? { ...car, isArchived: true } : car))
    );
  }

  unarchiveConsignmentCar(id: number) {
    this.consignmentCars.update(cars =>
      cars.map(car => (car.id === id ? { ...car, isArchived: false } : car))
    );
  }
}