import { Component, inject, signal, computed, effect, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { YearSpecificationService } from '../../../../services/year-specification.service';
import { YearSpecification } from '../../../../models/year-specification.model';
import { CarCategoryService } from '../../../../services/car-category.service';
import { CarCategory } from '../../../../types/car-category.model';
import { CarModelService } from '../../../../services/car-model.service';
import { CarModel } from '../../../../models/car-model.model';
import { ManufacturerService } from '../../../../services/manufacturer.service';
import { ManufactureYearService } from '../../../../services/manufacture-year.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../../services/permission.service';

/** Passed in when YearSpecificationFormComponent is opened via MatDialog.open(...) from
 *  CarCardComponent's Year Specification "+" button -- a Year Specification always belongs to a
 *  Trim, so the vehicle form's currently selected Trim is forwarded and pre-locked here, same
 *  pattern as CarCategoryQuickAddData locking Model. */
export interface YearSpecificationQuickAddData {
  trimId: number;
}

/** Year Specification Add/Edit: Make -> Model -> Trim -> Model Year cascading selection, then the
 *  technical specification fields (Requirement 5). Mirrors CarCategoryFormComponent's structure
 *  (routed page + quick-add dialog reuse, cascading dropdowns, locked-field pattern). */
@Component({
  selector: 'app-year-specification-form',
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
  templateUrl: './year-specification-form.component.html',
  styleUrl: './year-specification-form.component.css'
})
export class YearSpecificationFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private yearSpecService = inject(YearSpecificationService);
  private carCategoryService = inject(CarCategoryService);
  private carModelService = inject(CarModelService);
  private manufacturerService = inject(ManufacturerService);
  private manufactureYearService = inject(ManufactureYearService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);
  private dialogRef = inject(MatDialogRef<YearSpecificationFormComponent, YearSpecification | undefined>, { optional: true });
  private data = inject<YearSpecificationQuickAddData | null>(MAT_DIALOG_DATA, { optional: true });

  isQuickAddDialog = !!this.dialogRef;
  /** When set (quick-add from the Vehicle screen), the Trim field is pre-filled and locked --
   *  the new Year Specification must belong to the vehicle's already-selected Trim. */
  lockedTrimId = this.data?.trimId ?? null;

  specForm!: FormGroup;
  editMode = signal(false);
  pageTitle = signal('YEAR_SPECIFICATION.FORM.TITLE_NEW');

  canCreate = computed(() => this.permissionService.hasPermission('yearSpecification.create'));
  canEdit = computed(() => this.permissionService.hasPermission('yearSpecification.edit'));
  canSaveSpec = computed(() => this.editMode() ? this.canEdit() : this.canCreate());

  manufacturers = this.manufacturerService.manufacturers$;
  models: Signal<CarModel[]> = this.carModelService.carmodel$;
  trims: Signal<CarCategory[]> = this.carCategoryService.categories$;
  years = this.manufactureYearService.yearsWithIds$;

  selectedManufacturerId = signal<number | null>(null);
  selectedModelId = signal<number | null>(null);

  filteredModels = computed(() => {
    const manufacturerId = this.selectedManufacturerId();
    if (!manufacturerId) return [];
    return this.models().filter(m => m.manufacturerId === manufacturerId);
  });

  filteredTrims = computed(() => {
    const modelId = this.selectedModelId();
    if (!modelId) return [];
    return this.trims().filter(t => t.modelId === modelId);
  });

  /** Resolves Make/Model display once a Trim is already known (quick-add's lockedTrimId, or the
   *  loaded spec's trimId on edit) -- an effect re-runs automatically once trims()/models() finish
   *  loading, no polling required (same pattern as CarCategoryFormComponent). */
  private pendingTrimIdToResolve = signal<number | null>(this.lockedTrimId);

  constructor() {
    effect(() => {
      const trimId = this.pendingTrimIdToResolve();
      if (trimId == null) return;
      const trim = this.trims().find(t => t.id === trimId);
      if (!trim?.modelId) return;
      const model = this.models().find(m => m.id === trim.modelId);
      if (model) {
        this.selectedManufacturerId.set(model.manufacturerId);
        this.selectedModelId.set(model.id);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('YEAR_SPECIFICATION.FORM.TITLE_EDIT');
      this.yearSpecService.getById(id).subscribe({
        next: (spec) => {
          this.specForm.patchValue({
            id: spec.id,
            trimId: spec.trimId,
            yearId: spec.yearId,
            engineType: spec.engineType,
            engineCapacity: spec.engineCapacity,
            cylinderCount: spec.cylinderCount,
            horsepower: spec.horsepower,
            fuelType: spec.fuelType,
            transmission: spec.transmission,
            driveType: spec.driveType,
            standardAgencyPrice: spec.standardAgencyPrice,
            isActive: spec.isActive
          });
          this.pendingTrimIdToResolve.set(spec.trimId);
        },
        error: (error) => {
          console.error('Error loading Year Specification for edit', error);
          this.notificationService.showError(this.translate.instant('YEAR_SPECIFICATION.FORM.LOAD_ERROR'));
        }
      });
    }
  }

  private initForm(): void {
    this.specForm = this.fb.group({
      id: [null],
      trimId: [this.lockedTrimId, Validators.required],
      yearId: [null, Validators.required],
      engineType: [''],
      engineCapacity: [''],
      cylinderCount: [null],
      horsepower: [null],
      fuelType: [''],
      transmission: [''],
      driveType: [''],
      standardAgencyPrice: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
    if (this.lockedTrimId) {
      this.specForm.get('trimId')?.disable();
    }
  }

  /** Cascading resets (Requirement 9): changing the Make clears Model + Trim; changing the Model
   *  clears Trim. Never leaves a stale Trim selection that no longer matches the new Make/Model. */
  onManufacturerChange(manufacturerId: number | null): void {
    this.selectedManufacturerId.set(manufacturerId);
    this.selectedModelId.set(null);
    this.specForm.patchValue({ trimId: null });
  }

  onModelChange(modelId: number | null): void {
    this.selectedModelId.set(modelId);
    this.specForm.patchValue({ trimId: null });
  }

  saveSpec(): void {
    if (this.specForm.invalid) {
      this.specForm.markAllAsTouched();
      return;
    }

    // getRawValue(), not .value -- trimId is a disabled control in quick-add-with-locked-trim mode.
    const formValue = this.specForm.getRawValue();
    const { id, ...dto } = formValue;

    if (this.editMode()) {
      this.yearSpecService.update(id, dto).subscribe({
        next: () => {
          this.notificationService.showSuccess(this.translate.instant('TOAST.UPDATE_SUCCESS'));
          this.yearSpecService.getById(id).subscribe(updated => this.closeDialogOrNavigate(updated));
        },
        error: (error) => this.handleSaveError(error)
      });
    } else {
      this.yearSpecService.create(dto).subscribe({
        next: (created) => {
          this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
          this.closeDialogOrNavigate(created);
        },
        error: (error) => this.handleSaveError(error)
      });
    }
  }

  /** Surfaces the backend's specific reason (e.g. duplicate Trim+Year) instead of a generic
   *  failure message -- CreateAsync/UpdateAsync return BadRequest({message}) with that exact text. */
  private handleSaveError(error: unknown): void {
    console.error('Error saving Year Specification', error);
    const backendMessage = (error as { error?: { message?: string } })?.error?.message;
    this.notificationService.showError(backendMessage || this.translate.instant('TOAST.SAVE_ERROR'));
  }

  private closeDialogOrNavigate(spec: YearSpecification): void {
    if (this.dialogRef) {
      this.dialogRef.close(spec);
    } else {
      this.router.navigate(['/setup/year-specifications']);
    }
  }

  cancelDialog(): void {
    this.dialogRef?.close();
  }
}
