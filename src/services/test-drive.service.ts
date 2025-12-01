import { Injectable, signal } from '@angular/core';
import { TestDrive } from '../types/test-drive.model';

@Injectable({
  providedIn: 'root',
})
export class TestDriveService {
  private nextId = signal(3);
  private bookings = signal<TestDrive[]>([
    {
      id: 1,
      carId: 1,
      carDescription: 'Toyota Camry (2023)',
      customerId: 1,
      customerName: 'عبدالله محمد',
      startTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(new Date().getHours() + 1)).toISOString(),
      salesperson: 'أحمد مندوب مبيعات',
      status: 'Scheduled',
    },
    {
      id: 2,
      carId: 3,
      carDescription: 'BMW X5 (2023)',
      customerId: 2,
      customerName: 'فاطمة خالد',
      startTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
      endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(new Date().getHours() + 1)).toISOString(),
      salesperson: 'أحمد مندوب مبيعات',
      status: 'Scheduled',
    },
  ]);

  public bookings$ = this.bookings.asReadonly();

  getBookingById(id: number): TestDrive | undefined {
    return this.bookings().find(b => b.id === id);
  }

  addBooking(booking: Omit<TestDrive, 'id'>) {
    const newBooking: TestDrive = {
      ...booking,
      id: this.nextId(),
    };
    this.bookings.update(bookings => [...bookings, newBooking]);
    this.nextId.update(id => id + 1);
  }

  updateBooking(updatedBooking: TestDrive) {
    this.bookings.update(bookings =>
      bookings.map(b => (b.id === updatedBooking.id ? updatedBooking : b))
    );
  }
}
