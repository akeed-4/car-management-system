import { Injectable, signal, inject } from '@angular/core';
import { Delivery, DeliveryStatus, ChecklistItem } from '../types/delivery.model';
import { InventoryService } from './inventory.service';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private nextId = signal(2);
  private inventoryService = inject(InventoryService);

  // Fix: Explicitly typed the initial array as Delivery[] to ensure correct type inference for 'status'.
  private deliveries = signal<Delivery[]>([
    {
      id: 1,
      salesInvoiceId: 2, // Assuming INV-202406010900 from SalesService
      salesInvoiceNumber: 'INV-202406010900',
      carId: 1, // Toyota Camry
      carDescription: 'Toyota Camry (2023)',
      customerId: 1,
      customerName: 'عبدالله محمد',
      scheduledDate: new Date().toISOString().split('T')[0], // Today
      scheduledTime: '15:00',
      deliveryAgentId: 2, // Ahmed Salesperson
      deliveryAgentName: 'أحمد مندوب مبيعات',
      status: 'Scheduled' as DeliveryStatus,
      checklist: [
        { id: 1, description: 'تم تنظيف السيارة وتجهيزها', completed: false },
        { id: 2, description: 'تم فحص جميع السوائل والإطارات', completed: false },
        { id: 3, description: 'تم توقيع أوراق الاستلام النهائية', completed: false },
        { id: 4, description: 'تم شرح مميزات السيارة للعميل', completed: false },
        { id: 5, description: 'تم تسليم المفتاح الإضافي', completed: false },
      ],
      notes: 'العميل متحمس جداً.',
    },
  ]);

  public deliveries$ = this.deliveries.asReadonly();

  getDeliveryById(id: number): Delivery | undefined {
    return this.deliveries$().find(d => d.id === id);
  }

  addDelivery(delivery: Omit<Delivery, 'id'>) {
    const newDelivery: Delivery = {
      ...delivery,
      id: this.nextId(),
      status: 'Scheduled', // Always starts as scheduled
    };
    this.deliveries.update(deliveries => [...deliveries, newDelivery]);
    this.nextId.update(id => id + 1);

    // Update car location to 'Scheduled for Delivery' or similar
    this.inventoryService.updateCarLocation(newDelivery.carId, 'Out for Delivery Prep'); // Can use a more specific location
  }

  updateDelivery(updatedDelivery: Delivery) {
    this.deliveries.update(deliveries =>
      deliveries.map(d => (d.id === updatedDelivery.id ? updatedDelivery : d))
    );

    // Update car location based on delivery status
    if (updatedDelivery.status === 'Completed' || updatedDelivery.status === 'Canceled') {
        this.inventoryService.updateCarLocation(updatedDelivery.carId, 'In Showroom'); // Or return to available/sold
    } else if (updatedDelivery.status === 'In Progress') {
        this.inventoryService.updateCarLocation(updatedDelivery.carId, 'Out for Delivery');
    }
  }

  updateDeliveryChecklist(deliveryId: number, updatedChecklist: ChecklistItem[]) {
    this.deliveries.update(deliveries =>
      deliveries.map(d => (d.id === deliveryId ? { ...d, checklist: updatedChecklist } : d))
    );
  }

  // A method to finalize delivery (e.g., after checklist completion)
  completeDelivery(deliveryId: number) {
    this.deliveries.update(deliveries =>
      deliveries.map(d => {
        if (d.id === deliveryId) {
          const updated: Delivery = { ...d, status: 'Completed' as DeliveryStatus };
          this.inventoryService.updateCarLocation(updated.carId, 'Sold'); // Final status
          return updated;
        }
        return d;
      })
    );
  }
}