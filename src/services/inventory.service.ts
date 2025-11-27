import { Injectable, signal } from '@angular/core';
import { Car, CarStatus } from '../types/car.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private cars = signal<Car[]>([]);

  // Internal map to manage quantities (simulating inventory stock for each car ID)
  // In a real system, 'quantity' would likely be managed in a separate 'Stock' entity
  // or by counting unique VINs. For this app, we centralize here.
  private carQuantities = signal<Map<number, number>>(new Map());

  constructor() {
    // Initialize mock data
    const initialCars: Car[] = [
      {
        id: 1,
        vin: 'JN1AZ00Z00000001',
        plateNumber: '123 ABC',
        istimaraExpiry: '2025-08-15',
        fahasStatus: 'Valid',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        exteriorColor: 'White',
        interiorColor: 'Beige',
        mileage: 15000,
        transmission: 'Automatic',
        engineSize: '2.5L I4',
        status: 'Available',
        photos: ['https://picsum.photos/800/600?random=1'],
        purchasePrice: 95000,
        additionalCosts: 2500,
        totalCost: 97500,
        salePrice: 110000,
        description: 'Excellent condition Toyota Camry, low mileage, perfect for families. Fully loaded with modern features.',
      },
      {
        id: 2,
        vin: '1GKS2CKC00000002',
        plateNumber: '456 DEF',
        istimaraExpiry: '2024-11-20',
        fahasStatus: 'Valid',
        make: 'Ford',
        model: 'Explorer',
        year: 2022,
        exteriorColor: 'Black',
        interiorColor: 'Black',
        mileage: 45000,
        transmission: 'Automatic',
        engineSize: '3.5L V6',
        status: 'Available',
        photos: ['https://picsum.photos/800/600?random=2'],
        purchasePrice: 130000,
        additionalCosts: 5000,
        totalCost: 135000,
        salePrice: 155000,
        description: 'Spacious and powerful Ford Explorer. Great for road trips and off-road adventures. Recently serviced.',
      },
       {
        id: 3,
        vin: 'WBAJU5C500000003',
        plateNumber: '789 GHI',
        istimaraExpiry: '2026-01-10',
        fahasStatus: 'Valid',
        make: 'BMW',
        model: 'X5',
        year: 2023,
        exteriorColor: 'Blue',
        interiorColor: 'Tan',
        mileage: 5000,
        transmission: 'Automatic',
        engineSize: '3.0L I6 Turbo',
        status: 'Available',
        photos: ['https://picsum.photos/800/600?random=3'],
        purchasePrice: 280000,
        additionalCosts: 7000,
        totalCost: 287000,
        salePrice: 320000,
        description: 'Luxury BMW X5 with premium package. Barely used, showroom condition. A statement of performance and comfort.',
      },
      {
        id: 4,
        vin: 'SALLJ3DA00000004',
        plateNumber: '111 JKL',
        istimaraExpiry: '2025-05-01',
        fahasStatus: 'Valid',
        make: 'Hyundai',
        model: 'Elantra',
        year: 2023,
        exteriorColor: 'Silver',
        interiorColor: 'Gray',
        mileage: 22000,
        transmission: 'Automatic',
        engineSize: '2.0L I4',
        status: 'Available',
        photos: ['https://picsum.photos/800/600?random=4'],
        purchasePrice: 75000,
        additionalCosts: 1500,
        totalCost: 76500,
        salePrice: 85000,
        description: 'Reliable and fuel-efficient Hyundai Elantra. Perfect for city driving.',
      },
      {
        id: 5,
        vin: '3FA6P0HD00000005',
        plateNumber: '222 MNO',
        istimaraExpiry: '2026-03-12',
        fahasStatus: 'Valid',
        make: 'Ford',
        model: 'Mustang',
        year: 2021,
        exteriorColor: 'Red',
        interiorColor: 'Black',
        mileage: 31000,
        transmission: 'Automatic',
        engineSize: '5.0L V8',
        status: 'Available',
        photos: ['https://picsum.photos/800/600?random=5'],
        purchasePrice: 180000,
        additionalCosts: 6000,
        totalCost: 186000,
        salePrice: 210000,
        description: 'Iconic American muscle. A head-turner with incredible performance.',
      },
    ];

    this.cars.set(initialCars);
    // Initialize quantities for mock data. Assume 1 for each unique car instance.
    // Fix: Corrected how carQuantities signal is updated
    this.carQuantities.update(map => {
      initialCars.forEach(car => map.set(car.id, 1));
      return new Map(map); // Return a new map for signal update
    });
  }

  private nextId = 6;
  
  // Public signals
  public cars$ = this.cars.asReadonly();
  public carQuantities$ = this.carQuantities.asReadonly();

  getCarById(id: number) {
    return this.cars().find(car => car.id === id);
  }

  getCarQuantity(id: number): number {
    return this.carQuantities().get(id) ?? 0;
  }

  addCar(car: Omit<Car, 'id' | 'totalCost'>) {
    const newCar: Car = {
      ...car,
      id: this.nextId++,
      totalCost: car.purchasePrice + car.additionalCosts,
    };
    this.cars.update(cars => [...cars, newCar]);
    this.carQuantities.update(map => new Map(map.set(newCar.id, 1))); // Add 1 to stock for new car
  }

  updateCar(updatedCar: Car) {
    updatedCar.totalCost = updatedCar.purchasePrice + updatedCar.additionalCosts;
    this.cars.update(cars => 
      cars.map(car => car.id === updatedCar.id ? updatedCar : car)
    );
  }
  
  decrementCarQuantity(carId: number, quantityToDecrement: number): void {
    this.carQuantities.update(map => {
      const currentQuantity = map.get(carId) ?? 0;
      const newQuantity = Math.max(0, currentQuantity - quantityToDecrement);
      map.set(carId, newQuantity);
      
      // Update car status based on new quantity
      this.cars.update(cars => 
        cars.map(car => car.id === carId 
          ? { ...car, status: newQuantity <= 0 ? 'Sold' : 'Available' } 
          : car
        )
      );
      return new Map(map); // Return a new map for signal update
    });
  }

  incrementCarQuantity(carId: number, quantityToIncrement: number): void {
     this.carQuantities.update(map => {
      const currentQuantity = map.get(carId) ?? 0;
      const newQuantity = currentQuantity + quantityToIncrement;
      map.set(carId, newQuantity);

      // Update car status based on new quantity
      this.cars.update(cars => 
        cars.map(car => car.id === carId 
          ? { ...car, status: newQuantity > 0 ? 'Available' : car.status } 
          : car
        )
      );
      return new Map(map); // Return a new map for signal update
    });
  }

  setCarQuantity(carId: number, newQuantity: number) {
    this.carQuantities.update(map => {
      map.set(carId, newQuantity);
      this.cars.update(cars =>
        cars.map(car =>
          car.id === carId ? { ...car, status: newQuantity > 0 ? 'Available' : 'Sold' } : car
        )
      );
      return new Map(map); // Return a new map for signal update
    });
  }

  updateCarStatus(id: number, status: CarStatus) {
    this.cars.update(cars =>
      cars.map(car =>
        car.id === id ? { ...car, status } : car
      )
    );
  }

  deleteCar(id: number) {
    this.cars.update(cars => cars.filter(car => car.id !== id));
    this.carQuantities.update(map => { // Also remove from quantities map
      map.delete(id);
      return new Map(map);
    });
  }
}