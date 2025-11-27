import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../../services/customer.service';
import { Customer } from '../../../../types/customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);

  customer = signal<Partial<Customer>>({});
  editMode = signal(false);
  pageTitle = signal('إضافة عميل جديد');

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات العميل');
        const existingCustomer = this.customerService.getCustomerById(id);
        if (existingCustomer) {
          this.customer.set({ ...existingCustomer });
        } else {
          this.router.navigate(['/entities/customers']);
        }
      }
    });
  }
  
  updateCustomerField<K extends keyof Customer>(field: K, value: Customer[K]) {
    this.customer.update(c => ({ ...c, [field]: value }));
  }

  saveCustomer() {
    const customerData = this.customer();
    if (this.editMode()) {
        this.customerService.updateCustomer(customerData as Customer);
    } else {
        const { id, ...newCustomer } = customerData;
        this.customerService.addCustomer(newCustomer as Omit<Customer, 'id'>);
    }
    this.router.navigate(['/entities/customers']);
  }
}