


import { Injectable, signal } from '@angular/core';
import { Car, CarStatus, CarLocation } from '../types/car.model';

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
        condition: 'Used',
        exteriorColor: 'White',
        interiorColor: 'Beige',
        mileage: 15000,
        transmission: 'Automatic',
        engineSize: '2.5L I4',
        status: 'Available',
        currentLocation: 'In Showroom',
        photos: ['https://picsum.photos/800/600?random=1'],
        purchasePrice: 95000,
        additionalCosts: 2500,
        totalCost: 97500,
        salePrice: 110000,
        description: 'Excellent condition Toyota Camry, low mileage, perfect for families. Fully loaded with modern features.',
        purchaseDate: '2024-04-01',
        floorPlanId: 1,
        isArchived: false,
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
        condition: 'Used',
        exteriorColor: 'Black',
        interiorColor: 'Black',
        mileage: 45000,
        transmission: 'Automatic',
        engineSize: '3.5L V6',
        status: 'Available',
        currentLocation: 'In Showroom',
        photos: ['https://picsum.photos/800/600?random=2'],
        purchasePrice: 130000,
        additionalCosts: 5000,
        totalCost: 135000,
        salePrice: 155000,
        description: 'Spacious and powerful Ford Explorer. Great for road trips and off-road adventures. Recently serviced.',
        purchaseDate: '2024-03-15',
        floorPlanId: 2,
        isArchived: false,
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
        condition: 'Used',
        exteriorColor: 'Blue',
        interiorColor: 'Tan',
        mileage: 5000,
        transmission: 'Automatic',
        engineSize: '3.0L I6 Turbo',
        status: 'Available',
        currentLocation: 'In Showroom',
        photos: ['https://picsum.photos/800/600?random=3'],
        purchasePrice: 280000,
        additionalCosts: 7000,
        totalCost: 287000,
        salePrice: 320000,
        description: 'Luxury BMW X5 with premium package. Barely used, showroom condition. A statement of performance and comfort.',
        purchaseDate: '2024-05-10',
        floorPlanId: 1,
        isArchived: false,
      },
      {
        id: 4,
        vin: 'SALLJ3DA00000004',
        plateNumber: '111 JKL',
        istimaraExpiry: '2025-05-01',
        fahasStatus: 'Not Required',
        make: 'Hyundai',
        model: 'Elantra',
        year: 2024,
        condition: 'New',
        exteriorColor: 'Silver',
        interiorColor: 'Gray',
        mileage: 50,
        transmission: 'Automatic',
        engineSize: '2.0L I4',
        status: 'Available',
        currentLocation: 'In Showroom',
        photos: ['https://picsum.photos/800/600?random=4'],
        purchasePrice: 75000,
        additionalCosts: 1500,
        totalCost: 76500,
        salePrice: 85000,
        description: 'Brand new, reliable and fuel-efficient Hyundai Elantra. Perfect for city driving.',
        purchaseDate: '2024-05-01',
        isArchived: false,
      },
      {
        id: 5,
        vin: '3FA6P0HD00000005',
        plateNumber: '222 MNO',
        istimaraExpiry: '2026-03-12',
        fahasStatus: 'Valid',
        make: 'Ford',
        model: 'Mustang',
        year: 2024,
        condition: 'New',
        exteriorColor: 'Red',
        interiorColor: 'Black',
        mileage: 10,
        transmission: 'Automatic',
        engineSize: '5.0L V8',
        status: 'Available',
        currentLocation: 'Storage',
        photos: ['https://picsum.photos/800/600?random=5'],
        purchasePrice: 180000,
        additionalCosts: 6000,
        totalCost: 186000,
        salePrice: 210000,
        description: 'Iconic American muscle. A head-turner with incredible performance.',
        purchaseDate: '2024-02-20',
        floorPlanId: 3,
        isArchived: false,
      },
      {
        id: 6,
        vin: 'ABCDE12345678906',
        plateNumber: '333 XYZ',
        istimaraExpiry: '2025-10-01',
        fahasStatus: 'Valid',
        make: 'Nissan',
        model: 'Patrol',
        year: 2023,
        condition: 'Used',
        exteriorColor: 'Gray',
        interiorColor: 'Tan',
        mileage: 22000,
        transmission: 'Automatic',
        engineSize: '5.6L V8',
        status: 'In Maintenance', // Example of car in maintenance
        currentLocation: 'Service Bay 1',
        photos: ['https://picsum.photos/800/600?random=6'],
        purchasePrice: 170000,
        additionalCosts: 4000,
        totalCost: 174000,
        salePrice: 190000,
        description: 'Robust Nissan Patrol, ready for any terrain. Currently undergoing routine maintenance.',
        purchaseDate: '2024-03-01',
        isArchived: false,
      }
    ];

    this.cars.set(initialCars);
    // Initialize quantities for mock data. Assume 1 for each unique car instance.
    // Fix: Corrected how carQuantities signal is updated
    this.carQuantities.update(map => {
      initialCars.forEach(car => map.set(car.id, 1));
      return new Map(map); // Return a new map for signal update
    });
  }

  private nextId = 7;
  
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
      isArchived: false,
    };
    this.cars.update(cars => [...cars, newCar]);
    this.carQuantities.update(map => new Map(map.set(newCar.id, 1))); // Add 1 to stock for new car
  }

  updateCar(updatedCar: Car) {
    this.cars.update(cars => 
      cars.map(car => car.id === updatedCar.id ? updatedCar : car)
    );
  }
  
  decrementCarQuantity(carId: number, quantityToDecrement: number): void {
    this.carQuantities.update(map => {
      const currentQuantity = map.get(carId) ?? 0;
      const newQuantity = Math.max(0, currentQuantity - quantityToDecrement);
      map.set(carId, newQuantity);
      
      // When a car is sold, reserve it. Don't mark as Sold yet.
      this.cars.update(cars => 
        cars.map(car => car.id === carId 
          ? { ...car, status: newQuantity <= 0 ? 'Reserved' : 'Available' } 
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
  
  // This method is no longer used by SalesService due to refined workflow.
  // finalizeSaleStatus(carId: number) {
  //   this.cars.update(cars =>
  //     cars.map(car =>
  //       car.id === carId && car.status === 'Reserved' ? { ...car, status: 'Sold' } : car
  //     )
  //   );
  // }

  updateCarStatus(id: number, status: CarStatus) {
    this.cars.update(cars =>
      cars.map(car =>
        car.id === id ? { ...car, status } : car
      )
    );
  }

  updateCarLocation(id: number, location: CarLocation) {
    this.cars.update(cars =>
      cars.map(car =>
        car.id === id ? { ...car, currentLocation: location } : car
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
  
  archiveCar(id: number) {
    this.cars.update(cars =>
      cars.map(car => (car.id === id ? { ...car, isArchived: true } : car))
    );
  }

  unarchiveCar(id: number) {
    this.cars.update(cars =>
      cars.map(car => (car.id === id ? { ...car, isArchived: false } : car))
    );
  }
}
