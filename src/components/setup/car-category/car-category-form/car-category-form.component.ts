import { Component, inject, signal, computed, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CarCategoryService } from '../../../../services/car-category.service';
import { CarCategory } from '../../../../types/car-category.model';
import { CarModelService } from '../../../../services/car-model.service';
import { CarModel } from '../../../../models/car-model.model';
import { MatSelectModule } from '@angular/material/select';
import { ToastService } from '@/src/services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

/** Passed in when CarCategoryFormComponent is opened via MatDialog.open(...) from
 * CarCardComponent's Category "+" button -- Category depends on Model (CarCategory.modelId is
 * required, confirmed via CarCategoryService/CarCardComponent's filteredCategories), so the
 * currently selected model on the vehicle form is forwarded and pre-locked here. */
export interface CarCategoryQuickAddData {
  modelId: number;
}

@Component({
  selector: 'app-car-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
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
  private dialogRef = inject(MatDialogRef<CarCategoryFormComponent, CarCategory | undefined>, { optional: true });
  private data = inject<CarCategoryQuickAddData | null>(MAT_DIALOG_DATA, { optional: true });

  /** True only in dialog mode -- swaps the "back to list" link/page-header for dialog title/actions
   * without touching how the routed /setup/car-categories/new page renders. */
  isQuickAddDialog = !!this.dialogRef;
  /** When set (quick-add from CarCardComponent), the Model field is pre-filled and locked instead
   * of left as a free choice -- the new category must belong to the vehicle's model. */
  lockedModelId = this.data?.modelId ?? null;

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
      nameAr: ['',Validators.required],
      nameEn: [''],
      description: [''],
      modelId: [this.lockedModelId, Validators.required]
    });
    if (this.lockedModelId) {
      this.categoryForm.get('modelId')?.disable();
    }
  }



  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    // getRawValue(), not .value -- modelId is a disabled control in quick-add-with-locked-model
    // mode, and disabled controls are omitted from .value.
    const categoryData = this.categoryForm.getRawValue();

    if (this.editMode()) {
      const { ...category } = categoryData;
      const modelIds = categoryData.modelId ? [categoryData.modelId] : [];
      this.carCategoryService.updateCategoryWithModels(category, modelIds).subscribe({
        next: (updated) => {
          this.notificationService.showSuccess(this.translate.instant('TOAST.UPDATE_SUCCESS'));
          this.closeDialogOrNavigate(updated);
        },
        error: (error) => {
          console.error('Error updating category', error);
        }
      });
    } else {
      const { id, ...newCategory } = categoryData;
      const modelIds = categoryData.modelId ? [categoryData.modelId] : [];
      this.carCategoryService.addCategoryWithModels(newCategory, modelIds).subscribe({
        next: (created) => {
          this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
          this.closeDialogOrNavigate(created);
        },
        error: (error) => {
          console.error('Error creating category', error);
        }
      });
    }
  }

  /** Dialog mode: hand the saved category back to the caller (CarCardComponent). Routed-page
   * mode (dialogRef undefined): unchanged existing behavior, navigate back to the list. */
  private closeDialogOrNavigate(category: CarCategory): void {
    if (this.dialogRef) {
      this.dialogRef.close(category);
    } else {
      this.router.navigate(['/setup/car-categories']);
    }
  }

  /** No-op unless opened as a dialog -- cancels without creating anything, per the
   * "cancel does nothing" requirement. Routed-page Cancel link is unaffected (still a routerLink). */
  cancelDialog(): void {
    this.dialogRef?.close();
  }
}
