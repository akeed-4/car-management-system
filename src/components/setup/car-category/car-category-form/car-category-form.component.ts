import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { CarCategoryService } from '../../../../services/car-category.service';
import { CarCategory } from '../../../../types/car-category.model';

@Component({
  selector: 'app-car-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    TranslateModule
  ],
  templateUrl: './car-category-form.component.html',
  styleUrl: './car-category-form.component.css'
})
export class CarCategoryFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private carCategoryService = inject(CarCategoryService);

  categoryForm!: FormGroup;
  editMode = signal(false);
  pageTitle = signal('CAR_CATEGORY.FORM.TITLE_NEW');

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('CAR_CATEGORY.FORM.TITLE_EDIT');
      this.loadCategoryForEdit(id);
    }
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      nameAr: [''],
      nameEn: [''],
      description: ['']
    });
  }

  private loadCategoryForEdit(id: number): void {
    this.carCategoryService.getCategoryById(id).subscribe({
      next: (category) => {
        this.categoryForm.patchValue(category);
      },
      error: (error) => {
        console.error('Error loading category', error);
        this.router.navigate(['/setup/car-category']);
      }
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const categoryData = this.categoryForm.value;

    if (this.editMode()) {
      this.carCategoryService.updateCategory(categoryData).subscribe({
        next: () => {
          console.log('Category updated successfully');
          this.router.navigate(['/setup/car-category']);
        },
        error: (error) => {
          console.error('Error updating category', error);
        }
      });
    } else {
      const { id, ...newCategory } = categoryData;
      this.carCategoryService.addCategory(newCategory).subscribe({
        next: () => {
          console.log('Category created successfully');
          this.router.navigate(['/setup/car-category']);
        },
        error: (error) => {
          console.error('Error creating category', error);
        }
      });
    }
  }
}
