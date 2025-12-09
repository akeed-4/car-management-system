import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TestDriveService } from '../../services/test-drive.service';
import { InventoryService } from '../../services/inventory.service';
import { TestDrive, TestDriveStatus } from '../../types/test-drive.model';
import { TranslateModule } from '@ngx-translate/core';

interface DaySchedule {
  date: Date;
  bookings: TestDrive[];
}

@Component({
  selector: 'app-test-drives',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslateModule],
  templateUrl: './test-drives.component.html',
  styleUrl: './test-drives.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestDrivesComponent {
  private testDriveService = inject(TestDriveService);
  private inventoryService = inject(InventoryService);

  private bookings = this.testDriveService.bookings$;

  schedule = computed<DaySchedule[]>(() => {
    const days: DaySchedule[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create schedule for the next 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push({ date: day, bookings: [] });
    }

    // Populate bookings into the schedule
    for (const booking of this.bookings()) {
      const bookingDate = new Date(booking.startTime);
      bookingDate.setHours(0, 0, 0, 0);
      const dayIndex = Math.floor((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        days[dayIndex].bookings.push(booking);
      }
    }
    
    // Sort bookings within each day by start time
    days.forEach(day => day.bookings.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));

    return days;
  });

  updateStatus(booking: TestDrive, status: TestDriveStatus): void {
    if (booking.status === status) return;

    const updatedBooking = { ...booking, status };
    this.testDriveService.updateBooking(updatedBooking);

    // Update car location based on status change
    if (status === 'Completed' || status === 'Canceled') {
      this.inventoryService.updateCarLocation(booking.carId, 'In Showroom');
    }
  }
}
