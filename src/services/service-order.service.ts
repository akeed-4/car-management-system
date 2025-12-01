

import { Injectable, signal, inject } from '@angular/core';
import { ServiceOrder, ServiceOrderStatus } from '../types/service-order.model';
import { InventoryService } from './inventory.service';
import { ExpenseService } from './expense.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceOrderService {
  private nextId = signal(3);
  private inventoryService = inject(InventoryService);
  private expenseService = inject(ExpenseService);

  private serviceOrders = signal<ServiceOrder[]>([
    {
      id: 1,
      orderNumber: 'SO-20240601-001',
      dateIn: '2024-06-01',
      status: 'In Progress',
      carId: 6, // Linked to an inventory car
      carDescription: 'Nissan Patrol (2023)',
      customerName: 'المعرض (تجهيز للبيع)',
      serviceItems: [
        { description: 'تغيير زيت وفلتر', cost: 450 },
        { description: 'فحص عام', cost: 150 },
      ],
      totalCost: 600,
      notes: 'صيانة دورية قبل العرض.',
    },
    {
      id: 2,
      orderNumber: 'SO-20240602-002',
      dateIn: '2024-06-02',
      dateOut: '2024-06-02',
      status: 'Completed',
      customerName: 'عميل خارجي - محمد علي',
      customerPhone: '0501231234',
      serviceItems: [
        { description: 'تغيير إطارات', cost: 2000 },
        { description: 'ترصيص وميزان', cost: 200 },
      ],
      totalCost: 2200,
      notes: 'تم استلام السيارة من العميل.',
    },
  ]);

  public serviceOrders$ = this.serviceOrders.asReadonly();

  getServiceOrderById(id: number): ServiceOrder | undefined {
    return this.serviceOrders$().find(so => so.id === id);
  }

  addServiceOrder(order: Omit<ServiceOrder, 'id'>) {
    const newOrder: ServiceOrder = {
      ...order,
      id: this.nextId(),
      status: order.status || 'Pending', // Default status if not provided
    };
    this.serviceOrders.update(orders => [...orders, newOrder]);
    this.nextId.update(id => id + 1);

    // Update car status if it's an inventory car
    if (newOrder.carId) {
      this.inventoryService.updateCarStatus(newOrder.carId, 'In Maintenance');
    }
  }

  updateServiceOrder(updatedOrder: ServiceOrder) {
    this.serviceOrders.update(orders =>
      orders.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
    );

    // Handle car status and expense creation on status change
    const oldOrder = this.getServiceOrderById(updatedOrder.id);
    if (oldOrder && updatedOrder.status !== oldOrder.status) {
        if (updatedOrder.status === 'Completed' || updatedOrder.status === 'Canceled') {
            if (updatedOrder.carId) {
                // Return inventory car to Available/In Showroom
                this.inventoryService.updateCarStatus(updatedOrder.carId, 'Available');
            }

            // If completed, create an expense linked to the car for profitability tracking
            if (updatedOrder.status === 'Completed' && updatedOrder.carId) {
                this.expenseService.addExpense({
                    date: updatedOrder.dateOut || new Date().toISOString().split('T')[0],
                    description: `صيانة لسيارة المخزون: ${updatedOrder.carDescription}`,
                    category: 'Maintenance',
                    amount: updatedOrder.totalCost,
                    notes: `أمر عمل رقم: ${updatedOrder.orderNumber}`,
                    carId: updatedOrder.carId,
                    carDescription: updatedOrder.carDescription,
                    accountId: 1, // Default cash account
                    accountName: 'خزينة الكاش الرئيسية',
                });
            }
        } else if (updatedOrder.status === 'In Progress' && updatedOrder.carId) {
             this.inventoryService.updateCarStatus(updatedOrder.carId, 'In Maintenance');
        }
    }
  }
}
    