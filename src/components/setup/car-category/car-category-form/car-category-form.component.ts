import { Component, inject, signal, computed, effect, OnInit, Signal } from '@angular/core';
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
import { ManufacturerService } from '../../../../services/manufacturer.service';
import { MatSelectModule } from '@angular/material/select';
import { ToastService } from '@/src/services/toast.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../../services/permission.service';

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
  private manufacturerService = inject(ManufacturerService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);
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

  canCreate = computed(() => this.permissionService.hasPermission('carCategory.create'));
  canEdit = computed(() => this.permissionService.hasPermission('carCategory.edit'));
  canSaveCategory = computed(() => this.editMode() ? this.canEdit() : this.canCreate());
  models: Signal<CarModel[]> = this.carModelService.carmodel$;
  manufacturers = this.manufacturerService.manufacturers$;

  /** Make -> Model cascading (Requirement 4): the Model dropdown only ever offers models
   *  belonging to the selected Make. Not persisted on the Trim itself (CarCategory only stores
   *  ModelId) -- purely a filter driving the Model dropdown, same pattern as the Vehicle Add/Edit
   *  screen's own Make -> Model cascading. Writable directly (user picks a Make in the global-add
   *  case) and also driven by pendingModelIdToResolve below (edit/quick-add, where the Model --
   *  and therefore its Make -- is already known and just needs to be displayed). */
  selectedManufacturerId = signal<number | null>(null);
  filteredModels = computed(() => {
    const manufacturerId = this.selectedManufacturerId();
    if (!manufacturerId) return [];
    return this.models().filter(m => m.manufacturerId === manufacturerId);
  });

  /** Set (quick-add's lockedModelId immediately, or the loaded Trim's modelId on edit) whenever a
   *  Model is already known and its Make just needs deriving for display. A computed `effect`
   *  re-runs this resolution automatically whenever `models()` finishes loading -- no polling. */
  private pendingModelIdToResolve = signal<number | null>(this.lockedModelId);

  selectedModel = computed(() => {
    const modelId = this.categoryForm?.value?.modelId;
    if (!modelId) return '';
    const model = this.models().find(m => m.id === modelId);
    return model ? model.name : '';
  });

  constructor() {
    effect(() => {
      const targetModelId = this.pendingModelIdToResolve();
      if (targetModelId == null) return;
      const model = this.models().find(m => m.id === targetModelId);
      if (model) {
        this.selectedManufacturerId.set(model.manufacturerId);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('CAR_CATEGORY.FORM.TITLE_EDIT');
      this.carCategoryService.getCategoryById(id).subscribe({
        next: (category) => {
          this.categoryForm.patchValue({
            id: category.id,
            name: category.name,
            nameAr: category.nameAr ?? '',
            nameEn: category.nameEn ?? '',
            description: category.description ?? '',
            modelId: category.modelId ?? null
          });
          this.pendingModelIdToResolve.set(category.modelId ?? null);
        },
        error: (error) => {
          console.error('Error loading Trim for edit', error);
          this.notificationService.showError(this.translate.instant('CAR_CATEGORY.FORM.LOAD_ERROR'));
        }
      });
    }
  }

  /** Reset the Model whenever the Make changes -- the previously selected Model no longer
   *  necessarily belongs to the new Make (Requirement 9). */
  onManufacturerChange(manufacturerId: number | null): void {
    this.selectedManufacturerId.set(manufacturerId);
    this.categoryForm.patchValue({ modelId: null });
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
