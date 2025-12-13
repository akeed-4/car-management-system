import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Branch, Company } from '../../../types/branch.model';
import { BranchService } from '../../../services/branch.service';
import { CompanyService } from '../../../services/company.service';

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
    TranslateModule
  ],
  templateUrl: './branch-form.component.html',
  styleUrls: ['./branch-form.component.css']
})
export class BranchFormComponent implements OnInit {
  branchForm!: FormGroup;
  isEdit = false;
  companies: Company[] = [];

  constructor(
    private fb: FormBuilder,
    private branchService: BranchService,
    private companyService: CompanyService,
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
      nameEn: branch.name.en,
      nameAr: branch.name.ar,
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
      const formValue = this.branchForm.value;
      const branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'> = {
        name: { en: formValue.nameEn, ar: formValue.nameAr },
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
        this.branchService.update(this.data.branch.id, branchData).subscribe(() => {
          this.closeDialog();
        });
      } else {
        this.branchService.create(branchData).subscribe(() => {
          this.closeDialog();
        });
      }
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

  loadCompanies(): void {
    this.companyService.getAll().subscribe(companies => {
      this.companies = companies;
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCompanies();
    if (this.data?.branch) {
      this.isEdit = true;
      this.populateForm(this.data.branch);
    }
  }

  // Unit test: Test form validation, submit, edit mode
  // Storybook: Story for create/edit forms with different data
}