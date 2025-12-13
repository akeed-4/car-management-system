import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Company, Branch } from '../../../types/branch.model';
import { CompanyService } from '../../../services/company.service';
import { BranchService } from '../../../services/branch.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-company-form',
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
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.css']
})
export class CompanyFormComponent implements OnInit {
  companyForm!: FormGroup;
  isEdit = false;
  branches: Branch[] = [];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private branchService: BranchService,
    private toastService: ToastService,
    @Optional() public dialogRef: MatDialogRef<CompanyFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { company?: Company }
  ) {}

  initForm(): void {
    this.companyForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      description: [''],
      status: ['active', Validators.required],
      lat: [0],
      lng: [0],
      street: [''],
      city: [''],
      state: [''],
      country: [''],
      zipCode: ['']
    });
  }

  populateForm(company: Company): void {
    this.companyForm.patchValue({
      nameEn: company.name.en,
      nameAr: company.name.ar,
      description: company.description,
      status: company.status,
      lat: company.geo.lat,
      lng: company.geo.lng,
      street: company.address.street,
      city: company.address.city,
      state: company.address.state,
      country: company.address.country,
      zipCode: company.address.zipCode
    });
  }

  loadBranches(): void {
    this.branchService.getAll().subscribe(branches => {
      this.branches = branches;
    });
  }

  onSubmit(): void {
    if (this.companyForm.valid) {
      const formValue = this.companyForm.value;
      const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'branchName'> = {
        description: formValue.description,
        name: { en: formValue.nameEn, ar: formValue.nameAr },
        status: formValue.status,
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

      if (this.isEdit && this.data?.company) {
        this.companyService.update(this.data.company.id, companyData).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error updating company:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
          }
        });
      } else {
        this.companyService.create(companyData).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.ADD_SUCCESS');
            this.closeDialog();
          },
          error: (error) => {
            console.error('Error creating company:', error);
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
    this.loadBranches();
    if (this.data?.company) {
      this.isEdit = true;
      this.populateForm(this.data.company);
    }
  }

  // Unit test: Test form validation, submit, edit mode, branch loading
  // Storybook: Story for create/edit forms with different data
}