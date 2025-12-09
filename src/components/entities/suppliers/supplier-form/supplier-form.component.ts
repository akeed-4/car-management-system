import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService } from '../../../../services/supplier.service';
import { Supplier } from '../../../../types/supplier.model';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);

  supplier = signal<Partial<Supplier>>({});
  editMode = signal(false);
  pageTitle = signal('إضافة مورد جديد');

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات المورد');
        this.supplierService.getSupplierById(id).subscribe(existingSupplier => {
          this.supplier.set({ ...existingSupplier });
        }, error => {
          console.error('Error loading supplier:', error);
          this.router.navigate(['/entities/suppliers']);
        });
      }
    });
  }
  
  updateSupplierField<K extends keyof Supplier>(field: K, value: Supplier[K]) {
    this.supplier.update(s => ({ ...s, [field]: value }));
  }

  saveSupplier() {
    const supplierData = this.supplier();
    if (this.editMode()) {
        this.supplierService.updateSupplier(supplierData as Supplier);
    } else {
        const { id, ...newSupplier } = supplierData;
        this.supplierService.addSupplier(newSupplier as Omit<Supplier, 'id'>);
    }
    this.router.navigate(['/entities/suppliers']);
  }
}