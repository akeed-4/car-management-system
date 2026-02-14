import { Component, inject, signal, computed, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CarCategoryService } from '../../../../services/car-category.service';
import { CarCategory } from '../../../../types/car-category.model';
import { CarModelService } from '../../../../services/car-model.service';
import { CarModel } from '../../../../models/car-model.model';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ToastService } from '@/src/services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

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
    MatSelectModule,
    MatGridListModule,
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
  private carModelService = inject(CarModelService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  categoryForm!: FormGroup;
  editMode = signal(false);
  pageTitle = signal('CAR_CATEGORY.FORM.TITLE_NEW');
  models: Signal<CarModel[]> = this.carModelService.carmodel$;

  selectedModel = computed(() => {
    const modelId = this.categoryForm?.value?.modelId;
    if (!modelId) return '';
    const model = this.models().find(m => m.id === modelId);
    return model ? model.name : '';
  });

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('CAR_CATEGORY.FORM.TITLE_EDIT');
    }
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      nameAr: [''],
      nameEn: [''],
      description: [''],
      modelId: [null]
    });
  }



  saveCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const categoryData = this.categoryForm.value;

    if (this.editMode()) {
      const { ...category } = categoryData;
      const modelIds = categoryData.modelId ? [categoryData.modelId] : [];
      this.carCategoryService.updateCategoryWithModels(category, modelIds).subscribe({
        next: () => {
          this.notificationService.showSuccess(this.translate.instant('CAR_CATEGORY.FORM.UPDATE_SUCCESS'));
          this.router.navigate(['/setup/car-categories']);
        },
        error: (error) => {
          console.error('Error updating category', error);
        }
      });
    } else {
      const { id, ...newCategory } = categoryData;
      const modelIds = categoryData.modelId ? [categoryData.modelId] : [];
      this.carCategoryService.addCategoryWithModels(newCategory, modelIds).subscribe({
        next: () => {
        this.notificationService.showSuccess(this.translate.instant('CAR_CATEGORY.FORM.CREATE_SUCCESS'));
          this.router.navigate(['/setup/car-categories']);  
        },
        error: (error) => {
          console.error('Error creating category', error);
        }
      });
    }
  }
}
