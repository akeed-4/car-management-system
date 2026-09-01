

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ServiceOrder, ServiceItem, ServiceOrderStatus } from '../../../models/service-order.model';
import { ServiceOrderService } from '../../../services/service-order.service';
import { InventoryService } from '../../../services/inventory.service';
import { CustomerService } from '../../../services/customer.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-service-order-form',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './service-order-form.component.html',
  styleUrl: './service-order-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceOrderFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceOrderService = inject(ServiceOrderService);
  private inventoryService = inject(InventoryService);
  private customerService = inject(CustomerService);
  private notificationService = inject(NotificationService);

  serviceOrder = signal<Partial<ServiceOrder>>({
    dateIn: new Date().toISOString().split('T')[0],
    status: 'Pending',
    serviceItems: [],
    totalCost: 0,
    customerName: '',
  });

  editMode = signal(false);
  pageTitle = signal('إنشاء أمر عمل جديد');

  allInventoryCars = this.inventoryService.cars$;
  availableInventoryCars = computed(() => this.allInventoryCars().filter(c => c.status === 'Available' || c.status === 'In Maintenance'));
  selectedCarInForm = computed(() => this.serviceOrder().carId);

  constructor() {
    // effect(() => {
    //   const items = this.serviceOrder().serviceItems;
    //   const total = items ? items.reduce((sum, item) => sum + item.cost, 0) : 0;
    //   untracked(() => {
    //     this.serviceOrder.update(order => ({...order, totalCost: total}));
    //   });
    // });
  }

  ngOnInit() {
    console.log('ServiceOrderFormComponent initialized');
    const idParam = this.route.snapshot.params['id'];
    console.log('Route ID param:', idParam);
    
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل أمر العمل');
      const existing = this.serviceOrderService.getServiceOrderById(id);
      if (existing) {
        this.serviceOrder.set({ ...existing });
      } else {
        this.router.navigate(['/maintenance']);
      }
    } else {
      console.log('Creating new order');
    }
  }

  updateField<K extends keyof ServiceOrder>(field: K, value: ServiceOrder[K]) {
    this.serviceOrder.update(order => {
        const updatedOrder = { ...order, [field]: value };
        // If carId is selected, update carDescription and customerName
        if (field === 'carId' && value) {
            const car = this.allInventoryCars().find(c => c.id === value);
            if (car) {
                updatedOrder.carDescription = `${car.make} ${car.model} (${car.year}) - ${car.vin}`;
                updatedOrder.customerName = 'المعرض (تجهيز للبيع)'; // Default for internal cars
            }
        } else if (field === 'carId' && !value) {
            // If no car selected, clear car-specific fields
            updatedOrder.carDescription = undefined;
            updatedOrder.customerName = ''; // Must be filled for external
            updatedOrder.customerPhone = undefined;
        } else if (field === 'customerName' && !updatedOrder.carId) {
            // Ensure customerName is always set for external if carId is not present
            updatedOrder.customerName = value as string;
        }
        return updatedOrder;
    });
  }

  addServiceItem() {
    const newItem: ServiceItem = { description: '', cost: 0 };
    this.serviceOrder.update(order => ({ ...order, serviceItems: [...(order.serviceItems ?? []), newItem] }));
  }

  updateServiceItem(item: ServiceItem, field: keyof ServiceItem, value: any) {
    this.serviceOrder.update(order => {
      if (!order.serviceItems) return order;
      const updatedItems = order.serviceItems.map(existingItem => 
        existingItem === item ? { ...existingItem, [field]: value } : existingItem
      );
      return { ...order, serviceItems: updatedItems };
    });
  }

  removeServiceItem(item: ServiceItem) {
    this.serviceOrder.update(order => {
      if (!order.serviceItems) return order;
      const updatedItems = order.serviceItems.filter(existingItem => existingItem !== item);
      return { ...order, serviceItems: updatedItems };
    });
  }

  saveServiceOrder() {
    const orderData = this.serviceOrder();

    // Basic validation
    if (!orderData.dateIn || !orderData.customerName) {
      this.notificationService.showError('الرجاء تعبئة الحقول الأساسية: تاريخ الدخول، واسم العميل.');
      return;
    }
    if (orderData.serviceItems && orderData.serviceItems.some(item => !item.description || item.cost <= 0)) {
        this.notificationService.showError('الرجاء التأكد من إضافة وصف وتكلفة صحيحة لكل بند خدمة.');
        return;
    }
    if (!orderData.carId && !orderData.customerPhone) {
        this.notificationService.showError('الرجاء اختيار سيارة من المخزون أو إدخال رقم جوال للعميل الخارجي.');
        return;
    }


    if (this.editMode()) {
      this.serviceOrderService.updateServiceOrder(orderData as ServiceOrder);
    } else {
      const { id, ...newOrder } = orderData; // id is generated by service
      this.serviceOrderService.addServiceOrder(newOrder as Omit<ServiceOrder, 'id'>);
    }
    this.notificationService.showSuccess('تم حفظ أمر العمل بنجاح.');
    this.router.navigate(['/maintenance']);
  }
}
    