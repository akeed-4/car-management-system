

import { ChangeDetectionStrategy, Component, input, output, signal, computed, effect } from '@angular/core';
import { Delivery, ChecklistItem } from '../../../types/delivery.model';
import { DeliveryService } from '../../../services/delivery.service';
import { inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delivery-checklist-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './delivery-checklist-modal.component.html',
  styleUrl: './delivery-checklist-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryChecklistModalComponent {
  private deliveryService = inject(DeliveryService);

  isOpen = input.required<boolean>();
  delivery = input.required<Delivery | null>(); // The specific delivery object

  completed = output<Delivery>(); // Emits when delivery is marked complete
  canceled = output<void>(); // Emits when modal is closed without completing

  // Internal state for the checklist items to allow local changes
  currentChecklist = signal<ChecklistItem[]>([]);

  allTasksCompleted = computed(() => this.currentChecklist().every(item => item.completed));

  constructor() {
    // Effect to update internal checklist when input delivery changes
    effect(() => {
      const currentDelivery = this.delivery();
      if (currentDelivery && this.isOpen()) {
        // Create a deep copy to allow local modification without altering input signal directly
        this.currentChecklist.set(currentDelivery.checklist.map(item => ({ ...item })));
      }
    });
  }

  toggleChecklistItem(id: number): void {
    this.currentChecklist.update(list => 
      list.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }

  onCompleteDelivery(): void {
    const currentDelivery = this.delivery();
    if (currentDelivery) {
      // First, update the delivery's checklist in the service
      this.deliveryService.updateDeliveryChecklist(currentDelivery.id, this.currentChecklist());
      // Then, emit to parent component to mark as complete (which will call deliveryService.completeDelivery)
      this.completed.emit(currentDelivery);
    }
  }

  onCancel(): void {
    this.canceled.emit();
  }
}
    