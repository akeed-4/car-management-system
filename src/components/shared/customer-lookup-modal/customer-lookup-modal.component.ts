import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SharedDataGridComponent } from '../shared-data-grid/shared-data-grid.component';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';
import { dataGridColumnDto } from '../../../models/grid.model';

@Component({
  selector: 'app-customer-lookup-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SharedDataGridComponent,
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

  /** Config-driven columns for the Shared DataGrid (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'name', dataType: 'string', caption: 'CUSTOMER_LOOKUP.NAME' },
    { dataField: 'phone', dataType: 'string', caption: 'CUSTOMER_LOOKUP.PHONE', width: 140 },
    { dataField: 'nationalId', dataType: 'string', caption: 'CUSTOMER_LOOKUP.NATIONAL_ID', width: 140 },
    { dataField: 'city', dataType: 'string', caption: 'CUSTOMER_LOOKUP.CITY' },
    { dataField: 'email', dataType: 'string', caption: 'CUSTOMER_LOOKUP.EMAIL' },
  ];


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
