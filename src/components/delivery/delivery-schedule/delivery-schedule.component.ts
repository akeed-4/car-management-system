

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DeliveryService } from '../../../services/delivery.service';
import { Delivery, ChecklistItem, DeliveryStatus } from '../../../types/delivery.model';
import { DeliveryChecklistModalComponent } from '../delivery-checklist-modal/delivery-checklist-modal.component';

interface DaySchedule {
  date: Date;
  deliveries: Delivery[];
}

@Component({
  selector: 'app-delivery-schedule',
  standalone: true,
  imports: [RouterLink, DatePipe, DeliveryChecklistModalComponent],
  templateUrl: './delivery-schedule.component.html',
  styleUrl: './delivery-schedule.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryScheduleComponent {
  private deliveryService = inject(DeliveryService);

  private allDeliveries = this.deliveryService.deliveries$;

  // Checklist Modal state
  isChecklistModalOpen = signal(false);
  selectedDeliveryForChecklist = signal<Delivery | null>(null);

  schedule = computed<DaySchedule[]>(() => {
    const days: DaySchedule[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create schedule for the next 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push({ date: day, deliveries: [] });
    }

    // Populate deliveries into the schedule
    for (const delivery of this.allDeliveries()) {
      const deliveryDate = new Date(delivery.scheduledDate);
      deliveryDate.setHours(0, 0, 0, 0);
      const dayIndex = Math.floor((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) { // Only show for the next 7 days
        days[dayIndex].deliveries.push(delivery);
      }
    }
    
    // Sort deliveries within each day by scheduled time
    days.forEach(day => day.deliveries.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)));

    return days;
  });

  openChecklist(delivery: Delivery): void {
    this.selectedDeliveryForChecklist.set(delivery);
    this.isChecklistModalOpen.set(true);
  }

  onChecklistCompleted(delivery: Delivery): void {
    this.deliveryService.completeDelivery(delivery.id);
    this.isChecklistModalOpen.set(false);
    this.selectedDeliveryForChecklist.set(null);
  }

  onChecklistCanceled(): void {
    this.isChecklistModalOpen.set(false);
    this.selectedDeliveryForChecklist.set(null);
  }

  updateDeliveryStatus(delivery: Delivery, newStatus: DeliveryStatus): void {
    if (delivery.status === newStatus) return;

    const updatedDelivery = { ...delivery, status: newStatus };
    this.deliveryService.updateDelivery(updatedDelivery);
  }
}
    