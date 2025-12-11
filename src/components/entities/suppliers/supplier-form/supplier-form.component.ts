import { ChangeDetectionStrategy, Component, effect, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService } from '../../../../services/supplier.service';
import { Supplier } from '../../../../types/supplier.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private fb = inject(FormBuilder);

  supplierForm!: FormGroup;
  supplier = signal<Partial<Supplier>>({});
  editMode = signal(false);
  pageTitle = signal('إضافة مورد جديد');

  ngOnInit() {
    this.initializeForm();

    // Check if editing existing supplier
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات المورد');
      this.supplierService.getSupplierById(id).subscribe(existingSupplier => {
        this.supplier.set({ ...existingSupplier });
        this.supplierForm.patchValue(existingSupplier);
      }, error => {
        console.error('Error loading supplier:', error);
        this.router.navigate(['/entities/suppliers']);
      });
    }
  }

  private initializeForm() {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      crNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      taxNumber: [''],
      phone: ['', [Validators.required, Validators.pattern(/^\+966\d{9}$/)]],
      phone2: [''],
      email: ['', [Validators.email]],
      website: [''],
      address: ['', Validators.required],
      city: [''],
      district: [''],
      postalCode: [''],
      contactPerson: [''],
      contactPersonPhone: [''],
      contactPersonEmail: ['', [Validators.email]],
      paymentTerms: ['Net 30'],
      creditLimit: [null, [Validators.min(0)]],
      bankName: [''],
      bankAccountNumber: [''],
      iban: [''],
      supplierCategory: ['Parts'],
      notes: [''],
      isActive: [true]
    });
  }

  saveSupplier() {
    if (this.supplierForm.valid) {
      const formValue = this.supplierForm.value;
      const currentDate = new Date().toISOString();

      if (this.editMode()) {
        const updatedSupplier: Supplier = {
          ...this.supplier(),
          ...formValue,
          lastUpdated: currentDate
        } as Supplier;
        this.supplierService.updateSupplier(updatedSupplier);
      } else {
        const newSupplier: Omit<Supplier, 'id'> = {
          ...formValue,
          isActive: true,
          createdDate: currentDate,
          lastUpdated: currentDate
        };
        this.supplierService.addSupplier(newSupplier);
      }
      this.router.navigate(['/entities/suppliers']);
    }
  }
}