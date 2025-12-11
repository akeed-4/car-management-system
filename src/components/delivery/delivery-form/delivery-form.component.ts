

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, JsonPipe } from '@angular/common';
import { DeliveryService } from '../../../services/delivery.service';
import { SalesService } from '../../../services/sales.service';
import { CustomerService } from '../../../services/customer.service';
import { UserService } from '../../../services/user.service';
import { Delivery } from '../../../types/delivery.model';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-delivery-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    TranslateModule
  ],
  templateUrl: './delivery-form.component.html',
  styleUrl: './delivery-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deliveryService = inject(DeliveryService);
  private salesService = inject(SalesService);
  private customerService = inject(CustomerService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private currentSettingService = inject(CurrentSettingService);

  deliveryForm: FormGroup;

  layout$ = this.currentSettingService.getCardLayout(3);

  delivery = signal<Partial<Delivery>>({
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '10:00', // Default time
    checklist: [
      { id: 1, description: 'تم تنظيف السيارة وتجهيزها', completed: false },
      { id: 2, description: 'تم فحص جميع السوائل والإطارات', completed: false },
      { id: 3, description: 'تم توقيع أوراق الاستلام النهائية', completed: false },
      { id: 4, description: 'تم شرح مميزات السيارة للعميل', completed: false },
      { id: 5, description: 'تم تسليم المفتاح الإضافي', completed: false },
    ]
  });

  editMode = signal(false); // Delivery schedules are typically created, not edited as a whole form
  pageTitle = signal('جدولة تسليم مركبة');

  salespeople = computed(() => this.userService.users$().filter(u => u.roleName === 'مندوب مبيعات'));

  // Data for pre-filling from invoice
  private allInvoices = this.salesService.invoices$;
  selectedInvoice = signal<SalesInvoice | null>(null);

  constructor() {
    this.deliveryForm = this.fb.group({
      scheduledDate: [new Date().toISOString().split('T')[0], Validators.required],
      scheduledTime: ['10:00', Validators.required],
      deliveryAgentId: [null, Validators.required],
      notes: ['']
    });

    effect(() => {
      const invoiceIdParam = this.route.snapshot.params['invoiceId'];
      if (invoiceIdParam) {
        const invoiceId = Number(invoiceIdParam);
        const invoice = this.allInvoices().find(inv => inv.id === invoiceId);
        if (invoice) {
          this.selectedInvoice.set(invoice);
          const customer = this.customerService.getCustomerById(invoice.customerId);
          
          this.delivery.update(d => ({
            ...d,
            salesInvoiceId: invoice.id,
            salesInvoiceNumber: invoice.invoiceNumber,
            carId: invoice.items[0]?.carId, // Assuming one car per delivery for simplicity
            carDescription: invoice.items[0]?.carDescription,
            customerId: customer?.id,
            customerName: customer?.name,
          }));

          // Update form with pre-filled data
          this.deliveryForm.patchValue({
            scheduledDate: this.delivery().scheduledDate,
            scheduledTime: this.delivery().scheduledTime
          });
        } else {
          // If invoice not found, navigate back or to a generic new delivery form
          this.router.navigate(['/deliveries']);
        }
      }
    }, { allowSignalWrites: true });
  }

  saveDelivery(): void {
    if (this.deliveryForm.invalid) {
      return;
    }

    const formValue = this.deliveryForm.value;
    const deliveryData = this.delivery();
    const invoice = this.selectedInvoice();

    if (!deliveryData.salesInvoiceId || !invoice || !deliveryData.carId || !deliveryData.customerId) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة لجدولة التسليم.');
      return;
    }
    
    // Ensure car and customer descriptions are present from the invoice
    deliveryData.carDescription = invoice.items[0]?.carDescription;
    deliveryData.customerName = invoice.customerName;
    deliveryData.salesInvoiceNumber = invoice.invoiceNumber;
    deliveryData.deliveryAgentName = this.salespeople().find(p => p.id === formValue.deliveryAgentId)?.name;
    deliveryData.scheduledDate = formValue.scheduledDate;
    deliveryData.scheduledTime = formValue.scheduledTime;
    deliveryData.notes = formValue.notes;

    // For simplicity, delivery schedules are always new, not edited via this form
    const { id, ...newDelivery } = deliveryData;
    this.deliveryService.addDelivery(newDelivery as Omit<Delivery, 'id'>);
    
    alert('تمت جدولة التسليم بنجاح.');
    this.router.navigate(['/deliveries']);
  }
}    