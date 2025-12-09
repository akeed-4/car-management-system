import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TestDriveService } from '../../../services/test-drive.service';
import { CustomerService } from '../../../services/customer.service';
import { InventoryService } from '../../../services/inventory.service';
import { UserService } from '../../../services/user.service';
import { TestDrive } from '../../../types/test-drive.model';

@Component({
  selector: 'app-test-drive-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './test-drive-form.component.html',
  styleUrl: './test-drive-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestDriveFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private testDriveService = inject(TestDriveService);
  private customerService = inject(CustomerService);
  private inventoryService = inject(InventoryService);
  private userService = inject(UserService);

  // Form State
  booking = signal<Partial<TestDrive>>({ status: 'Scheduled' });
  bookingDate = signal(new Date().toISOString().split('T')[0]);
  startTime = signal('');
  endTime = signal('');

  editMode = signal(false);
  pageTitle = signal('حجز تجربة قيادة جديدة');

  // Data Sources
  customers = this.customerService.customers$;
  private allCars = this.inventoryService.cars$;
  availableCars = computed(() => this.allCars().filter(c => c.currentLocation === 'In Showroom' && c.status === 'Available'));
  salespeople = computed(() => this.userService.users$().filter(u => u.roleName === 'مندوب مبيعات'));

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل حجز تجربة قيادة');
        this.testDriveService.getBookingById(id).subscribe({
          next: (existingBooking) => {
            this.booking.set({ ...existingBooking });
            const start = new Date(existingBooking.startTime);
            this.bookingDate.set(start.toISOString().split('T')[0]);
            this.startTime.set(start.toTimeString().substring(0, 5));
            const end = new Date(existingBooking.endTime);
            this.endTime.set(end.toTimeString().substring(0, 5));
          },
          error: () => {
            this.router.navigate(['/test-drives']);
          }
        });
      }
    });
  }

  updateField<K extends keyof TestDrive>(field: K, value: TestDrive[K]) {
    this.booking.update(b => ({ ...b, [field]: value }));
  }

  saveTestDrive() {
    const bookingData = this.booking();
    const date = this.bookingDate();
    const start = this.startTime();
    const end = this.endTime();

    const car = this.availableCars().find(c => c.id === bookingData.carId);
    const customer = this.customers().find(c => c.id === bookingData.customerId);
    
    if (!car || !customer || !bookingData.salesperson || !date || !start || !end) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة.');
      return;
    }

    const startDateTime = new Date(`${date}T${start}`);
    const endDateTime = new Date(`${date}T${end}`);
    
    if(startDateTime >= endDateTime) {
        alert('وقت النهاية يجب أن يكون بعد وقت البداية.');
        return;
    }

    const finalBooking = {
      ...bookingData,
      carDescription: `${car.make} ${car.model} (${car.year})`,
      customerName: customer.name,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    };

    if (this.editMode()) {
      this.testDriveService.updateBooking(finalBooking as TestDrive);
    } else {
      const { id, ...newBooking } = finalBooking;
      this.testDriveService.addBooking(newBooking as Omit<TestDrive, 'id'>);
    }
    
    // Update car's location
    this.inventoryService.updateCarLocation(car.id, 'Out for Test Drive');

    alert('تم حفظ الحجز بنجاح.');
    this.router.navigate(['/test-drives']);
  }
}
