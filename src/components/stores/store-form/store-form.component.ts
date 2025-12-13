import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Store, Company, Branch } from '../../../types/branch.model';
import { StoreService } from '../../../services/store.service';
import { CompanyService } from '../../../services/company.service';
import { BranchService } from '../../../services/branch.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-store-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './store-form.component.html',
  styleUrls: ['./store-form.component.css']
})
export class StoreFormComponent implements OnInit {
  storeForm!: FormGroup;
  isEdit = false;
  companies: Company[] = [];
  branches: Branch[] = [];

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private companyService: CompanyService,
    private branchService: BranchService,
    private toastService: ToastService,
    @Optional() public dialogRef: MatDialogRef<StoreFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { store?: Store }
  ) {}

  initForm(): void {
    this.storeForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      description: [''],
      status: ['active', Validators.required],
      companyId: ['', Validators.required],
      branchId: ['', Validators.required],
      lat: [0],
      lng: [0],
      street: [''],
      city: [''],
      state: [''],
      country: [''],
      zipCode: ['']
    });
  }

  populateForm(store: Store): void {
    this.storeForm.patchValue({
      nameEn: store.name.en,
      nameAr: store.name.ar,
      description: store.description,
      status: store.status,
      companyId: store.companyId,
      branchId: store.branchId,
      lat: store.geo.lat,
      lng: store.geo.lng,
      street: store.address.street,
      city: store.address.city,
      state: store.address.state,
      country: store.address.country,
      zipCode: store.address.zipCode
    });
  }

  loadCompanies(): void {
    this.companyService.getAll().subscribe(companies => {
      this.companies = companies;
    });
  }

  loadBranches(): void {
    this.branchService.getAll().subscribe(branches => {
      this.branches = branches;
    });
  }

  onSubmit(): void {
    if (this.storeForm.valid) {
      const formValue = this.storeForm.value;
      const storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'> = {
        name: { en: formValue.nameEn, ar: formValue.nameAr },
        description: formValue.description,
        status: formValue.status,
        companyId: formValue.companyId,
        branchId: formValue.branchId,
        createdBy: 'currentUser',
        permissions: [],
        tags: [],
        geo: { lat: formValue.lat, lng: formValue.lng },
        address: {
          street: formValue.street,
          city: formValue.city,
          state: formValue.state,
          country: formValue.country,
          zipCode: formValue.zipCode
        }
      };

      if (this.isEdit && this.data?.store) {
        this.storeService.update(this.data.store.id, storeData).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error updating store:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
          }
        });
      } else {
        this.storeService.create(storeData).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.ADD_SUCCESS');
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error creating store:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
          }
        });
      }
    } else {
      this.toastService.showWarning('TOAST.VALIDATION_ERROR');
    }
  }

  onCancel(): void {
    this.closeDialog();
  }

  private closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCompanies();
    this.loadBranches();
    if (this.data?.store) {
      this.isEdit = true;
      this.populateForm(this.data.store);
    }
  }

  // Unit test: Test form validation, submit, edit mode, activity/branch loading
  // Storybook: Story for create/edit forms with different data
}