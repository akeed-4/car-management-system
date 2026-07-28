

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../../services/customer.service';
import { Customer } from '../../../../models/customer.model';
import { SalesService } from '../../../../services/sales.service';
import { InventoryService } from '../../../../services/inventory.service';
import { Car } from '../../../../models/car.model';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../../services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

/** Section id -> the form control names it contains, used to auto-expand + scroll to whichever
 *  collapsed section holds the first invalid control on a failed submit (business requirement:
 *  hidden validation errors must never silently block saving). Keep in sync with the panels in
 *  customer-form.component.html. */
const SECTION_FIELDS: Record<string, string[]> = {
  basic: ['name', 'nationalId', 'phone', 'phone2'],
  contact: ['email', 'preferredContactMethod'],
  address: ['city', 'district', 'postalCode', 'address'],
  personal: ['dateOfBirth', 'gender', 'occupation', 'employer', 'monthlyIncome', 'creditScore'],
  financial: ['creditLimit'],
  additional: ['notes', 'isActive'],
};

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatRadioModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()]
})
export class CustomerFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private salesService = inject(SalesService);
  private inventoryService = inject(InventoryService);
  private toastService = inject(NotificationService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  customerForm!: FormGroup;
  customer = signal<Partial<Customer>>({});
  editMode = signal(false);
  pageTitle = signal('إضافة عميل جديد');

  soldCars = signal<(Car & { saleDate: string })[]>([]);

  /** "Basic Info" (name/ID/phone) starts open since it's filled first for every customer; the
   *  rest start collapsed to cut initial scroll. Sections toggle independently (multi: true). */
  expandedSections = signal<Set<string>>(new Set(['basic']));

  isSectionExpanded(section: string): boolean {
    return this.expandedSections().has(section);
  }

  toggleSection(section: string, expanded: boolean): void {
    this.expandedSections.update(set => {
      const next = new Set(set);
      if (expanded) next.add(section); else next.delete(section);
      return next;
    });
  }

  ngOnInit() {
    this.initializeForm();

    // Check if editing existing customer
    const idParam = this.route.snapshot.params['id'];
    console.log('CustomerFormComponent ngOnInit, idParam:', idParam);
    if (idParam) {
      const id = Number(idParam);
      console.log('Editing customer with id:', id);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات العميل');
      this.customerService.getCustomerById(id).then(existingCustomer => {
        if (existingCustomer) {
          this.customer.set(existingCustomer);
          this.customerForm.patchValue(existingCustomer);

          // Fetch sold cars for this customer
          this.salesService.getInvoicesByCustomerId(existingCustomer.id).subscribe({
            next: (customerInvoices) => {
              const carsMap = new Map(this.inventoryService.cars$().map(c => [c.id, c]));
              const cars: (Car & { saleDate: string })[] = [];
              customerInvoices.forEach(inv => {
                  inv.items.forEach(item => {
                      const car = carsMap.get(item.carId);
                      if(car) {
                          const carWithSaleDate: Car & { saleDate: string } = {
                              ...car,
                              saleDate: inv.invoiceDate // Add saleDate from invoice
                          };
                          cars.push(carWithSaleDate);
                      }
                  });
              });
              this.soldCars.set(cars);
            }
          });
        } else {
          this.router.navigate(['/entities/customers']);
        }
      }).catch(error => {
        console.error('Error loading customer:', error);
        this.router.navigate(['/entities/customers']);
      });
    }
  }

  private initializeForm() {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      nationalId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      phone2: [''],
      email: ['', [Validators.email]],
      address: ['', Validators.required],
      city: [''],
      district: [''],
      postalCode: [''],
      dateOfBirth: [null],
      gender: [''],
      occupation: [''],
      employer: [''],
      monthlyIncome: [null, [Validators.min(0)]],
      creditScore: [null, [Validators.min(0), Validators.max(10000000)]],
      creditLimit: [null, [Validators.required, Validators.min(0)]],
      preferredContactMethod: ['Phone'],
      notes: [''],
      isActive: [true]
    });
  }
  
  saveCustomer() {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;
      const currentDate = new Date().toISOString();

      if (this.editMode()) {
        const updatedCustomer: Customer = {
          ...this.customer(),
          ...formValue,
          lastUpdated: currentDate
        } as Customer;
        this.customerService.updateCustomer(updatedCustomer).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
            this.router.navigate(['/entities/customers']);
          },
          error: (error) => {
            console.error('Error updating customer:', error);
           this.toastService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
          }
        });
      } else {
        const newCustomer: Omit<Customer, 'id'> = {
          ...formValue,
          isActive: true,
          createdDate: currentDate,
          lastUpdated: currentDate
        };
        this.customerService.addCustomer(newCustomer).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.ADD_SUCCESS');
            this.router.navigate(['/entities/customers']);
          },
          error: (error) => {
            console.error('Error adding customer:', error);
           this.toastService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
          }
        });
      }
    } else {
      this.customerForm.markAllAsTouched();
      this.expandInvalidSectionAndScroll();
      this.toastService.showWarning('TOAST.VALIDATION_ERROR');
    }
  }

  /** Finds the first collapsed section containing an invalid control, expands it, and scrolls
   *  its header into view -- a validation error must never be silently hidden behind a collapsed
   *  panel (business requirement). Runs on failed submit only; markAllAsTouched() (called just
   *  before this) is what makes the mat-error text actually render once the panel opens. */
  private expandInvalidSectionAndScroll(): void {
    const invalidSection = Object.entries(SECTION_FIELDS).find(([, fields]) =>
      fields.some(f => this.customerForm.get(f)?.invalid)
    )?.[0];
    if (!invalidSection) return;

    this.toggleSection(invalidSection, true);
    // The panel's expand animation/content needs a real paint before it has a height to scroll
    // to -- a microtask fires before that, so this waits a frame instead.
    requestAnimationFrame(() => {
      document.getElementById(`customer-section-${invalidSection}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  getDaysRemaining(dateStr: string): number | null {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getFahasExpiry(saleDateStr: string): string {
      const saleDate = new Date(saleDateStr);
      saleDate.setFullYear(saleDate.getFullYear() + 1);
      return saleDate.toISOString().split('T')[0];
  }
}
    