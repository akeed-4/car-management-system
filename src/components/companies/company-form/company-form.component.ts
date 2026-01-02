import { Component, OnInit, Inject, Optional, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BranchService } from '@/src/services/branch.service';
import { CompanyService } from '@/src/services/company.service';
import { ToastService } from '@/src/services/toast.service';
import { Branch, Company } from '@/src/types/branch.model';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

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
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.css']
})
export class CompanyFormComponent implements OnInit {
  companyForm!: FormGroup;
  isEdit = false;
  isLoading = signal(false);
  branches: Branch[] = [];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private branchService: BranchService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
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
      nameEn: company.nameEn,
      nameAr: company.nameAr,
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
        nameAr: formValue.nameAr,
        nameEn: formValue.nameEn,
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
            this.closeDialogOrNavigate();
          },
          error: (error) => {
            console.error('Error updating company:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
          }
        });
      } else if (this.isEdit && this.route.snapshot.params['id']) {
        // Handle route-based editing
        const companyId = this.route.snapshot.params['id'];
        this.companyService.update(companyId, companyData).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
            this.closeDialogOrNavigate();
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
            this.closeDialogOrNavigate();
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
    this.closeDialogOrNavigate();
  }

  private closeDialogOrNavigate(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/companies']);
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();

    // Check if we're in edit mode via route or dialog
    const routeId = this.route.snapshot.params['id'];
    if (routeId) {
      this.isEdit = true;
      this.isLoading.set(true);
      this.companyService.getById(routeId).subscribe({
        next: (company) => {
          this.populateForm(company);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading company for edit:', error);
          this.toastService.showError('TOAST.LOAD_ERROR');
          this.isLoading.set(false);
          this.router.navigate(['/companies']);
        }
      });
    } else if (this.data?.company) {
      this.isEdit = true;
      this.populateForm(this.data.company);
    }
  }

  // Unit test: Test form validation, submit, edit mode, branch loading
  // Storybook: Story for create/edit forms with different data
}