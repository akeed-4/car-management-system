import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';

@Component({
  selector: 'app-customer-lookup-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DxDataGridModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './customer-lookup-modal.component.html',
  styleUrl: './customer-lookup-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLookupModalComponent {
  private customerService = inject(CustomerService);
  private dialogRef = inject(MatDialogRef<CustomerLookupModalComponent>);

  customers = this.customerService.customers$;

  filterForm = new FormGroup({
    nameSearch: new FormControl(''),
    phoneSearch: new FormControl(''),
  });

  filteredCustomers = computed(() => {
    let customers = this.customers();
    const filters = this.filterForm.value;

    if (filters.nameSearch?.trim()) {
      const nameLower = filters.nameSearch.toLowerCase();
      customers = customers.filter(c => c.name?.toLowerCase().includes(nameLower));
    }
    if (filters.phoneSearch?.trim()) {
      const phoneLower = filters.phoneSearch.toLowerCase();
      customers = customers.filter(c => c.phone?.toLowerCase().includes(phoneLower));
    }

    return customers;
  });

  selectedCustomer = signal<Customer | null>(null);

  onCustomerSelect(customer: Customer) {
    this.selectedCustomer.set(customer);
  }

  confirmSelection() {
    if (this.selectedCustomer()) {
      this.dialogRef.close(this.selectedCustomer());
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }

  resetFilters() {
    this.filterForm.reset();
    this.selectedCustomer.set(null);
  }
}
