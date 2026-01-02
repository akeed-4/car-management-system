import { Component, OnInit, Inject, Optional, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Branch, Company } from '../../../types/branch.model';
import { BranchService } from '../../../services/branch.service';
import { CompanyService } from '../../../services/company.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-branch-form',
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
  templateUrl: './branch-form.component.html',
  styleUrls: ['./branch-form.component.css']
})
export class BranchFormComponent implements OnInit {
  branchForm!: FormGroup;
  isEdit = false;
  isLoading = signal(false);
  companies: Company[] = [];

  constructor(
    private fb: FormBuilder,
    private branchService: BranchService,
    private companyService: CompanyService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    @Optional() public dialogRef: MatDialogRef<BranchFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { branch?: Branch }
  ) {}

  initForm(): void {
    this.branchForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      description: [''],
      status: ['active', Validators.required],
      companyId: ['', Validators.required],
      lat: [0],
      lng: [0],
      street: [''],
      city: [''],
      state: [''],
      country: [''],
      zipCode: ['']
    });
  }

  populateForm(branch: Branch): void {
    this.branchForm.patchValue({
      nameEn: branch.nameEn,
      nameAr: branch.nameAr,
      description: branch.description,
      status: branch.status,
      companyId: branch.companyId,
      lat: branch.geo.lat,
      lng: branch.geo.lng,
      street: branch.address.street,
      city: branch.address.city,
      state: branch.address.state,
      country: branch.address.country,
      zipCode: branch.address.zipCode
    });
  }

  onSubmit(): void {
    if (this.branchForm.valid) {
      this.isLoading.set(true);
      const formValue = this.branchForm.value;
      const branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'> = {
        nameEn: formValue.nameEn,
        nameAr: formValue.nameAr,
        description: formValue.description,
        status: formValue.status,
        companyId: formValue.companyId,
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

      if (this.isEdit && this.data?.branch) {
        this.branchService.update(this.data.branch.id, branchData).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
            this.isLoading.set(false);
            this.closeDialogOrNavigate();
          },
          error: (error) => {
            console.error('Error updating branch:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
            this.isLoading.set(false);
          }
        });
      } else if (this.isEdit && this.route.snapshot.params['id']) {
        // Handle route-based editing
        const branchId = this.route.snapshot.params['id'];
        this.branchService.update(branchId, branchData).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
            this.isLoading.set(false);
            this.closeDialogOrNavigate();
          },
          error: (error) => {
            console.error('Error updating branch:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
            this.isLoading.set(false);
          }
        });
      } else {
        this.branchService.create(branchData).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.ADD_SUCCESS');
            this.isLoading.set(false);
            this.closeDialogOrNavigate();
          },
          error: (error) => {
            console.error('Error creating branch:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
            this.isLoading.set(false);
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
      this.router.navigate(['/branches']);
    }
  }

  loadCompanies(): void {
    this.companyService.getAll().subscribe(companies => {
      this.companies = companies;
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCompanies();

    // Check if we're in edit mode via route or dialog
    const routeId = this.route.snapshot.params['id'];
    if (routeId) {
      this.isEdit = true;
      this.isLoading.set(true);
      this.branchService.getById(routeId).subscribe({
        next: (branch) => {
          this.populateForm(branch);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading branch for edit:', error);
          this.toastService.showError('TOAST.LOAD_ERROR');
          this.isLoading.set(false);
          this.router.navigate(['/branches']);
        }
      });
    } else if (this.data?.branch) {
      this.isEdit = true;
      this.populateForm(this.data.branch);
    }
  }

  // Unit test: Test form validation, submit, edit mode
  // Storybook: Story for create/edit forms with different data
}