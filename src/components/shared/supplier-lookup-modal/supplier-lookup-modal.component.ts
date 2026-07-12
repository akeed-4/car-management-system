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
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../models/supplier.model';

@Component({
  selector: 'app-supplier-lookup-modal',
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
  templateUrl: './supplier-lookup-modal.component.html',
  styleUrl: './supplier-lookup-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierLookupModalComponent {
  private supplierService = inject(SupplierService);
  private dialogRef = inject(MatDialogRef<SupplierLookupModalComponent>);

  suppliers = this.supplierService.suppliers$;

  filterForm = new FormGroup({
    nameSearch: new FormControl(''),
    phoneSearch: new FormControl(''),
  });

  filteredSuppliers = computed(() => {
    let suppliers = this.suppliers();
    const filters = this.filterForm.value;

    if (filters.nameSearch?.trim()) {
      const nameLower = filters.nameSearch.toLowerCase();
      suppliers = suppliers.filter(s => s.name?.toLowerCase().includes(nameLower));
    }
    if (filters.phoneSearch?.trim()) {
      const phoneLower = filters.phoneSearch.toLowerCase();
      suppliers = suppliers.filter(s => s.phone?.toLowerCase().includes(phoneLower));
    }

    return suppliers;
  });

  selectedSupplier = signal<Supplier | null>(null);

  onSupplierSelect(supplier: Supplier) {
    this.selectedSupplier.set(supplier);
  }

  confirmSelection() {
    if (this.selectedSupplier()) {
      this.dialogRef.close(this.selectedSupplier());
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }

  resetFilters() {
    this.filterForm.reset();
    this.selectedSupplier.set(null);
  }
}
