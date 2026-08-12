import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CarModelService } from '../../../../services/car-model.service';
import { ManufacturerService } from '../../../../services/manufacturer.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastService } from '../../../../services/toast.service';
import { CarModel } from '../../../../models/car-model.model';
import { NotificationService } from '@/src/services/notification.service';

type SortColumn = keyof CarModel | '';
type SortDirection = 'asc' | 'desc' | '';

/** Passed in when CarModelsComponent is opened via MatDialog.open(...) from CarCardComponent's
 * Model "+" button -- Model depends on Manufacturer (CarModel.manufacturerId is required), so the
 * currently selected manufacturer on the vehicle form is forwarded and pre-locked here rather than
 * left for the user to re-pick. */
export interface CarModelQuickAddData {
  manufacturerId: number;
}

@Component({
  selector: 'app-car-models',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatGridListModule, MatIconModule, TranslateModule, ModalComponent, MatDialogModule],
  templateUrl: './car-models.component.html',
  styleUrl: './car-models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarModelsComponent implements OnInit {
  private carModelService = inject(CarModelService);
  private manufacturerService = inject(ManufacturerService);
  private currentSettingService = inject(CurrentSettingService);
  private fb = inject(FormBuilder);
  private toastService = inject(NotificationService);
  private translate = inject(TranslateService);
  private dialogRef = inject(MatDialogRef<CarModelsComponent, CarModel | undefined>, { optional: true });
  private data = inject<CarModelQuickAddData | null>(MAT_DIALOG_DATA, { optional: true });

  /** True only in dialog mode -- hides the list/search/sort table so the popup is just the
   * quick-add form, without touching how the routed page renders. */
  isQuickAddDialog = !!this.dialogRef;
  /** When set (quick-add from CarCardComponent), the Manufacturer field is pre-filled and locked
   * instead of left as a free choice -- the new model must belong to the vehicle's manufacturer. */
  lockedManufacturerId = this.data?.manufacturerId ?? null;

  carModels = toSignal(this.carModelService.getCarModels(), { initialValue: [] });
  manufacturers = this.manufacturerService.manufacturers$;
  cardLayout$ = this.currentSettingService.getCardLayout(1);

  carModelForm!: FormGroup;

  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Edit mode
  isEditMode = signal(false);
  editingModel = signal<CarModel | null>(null);

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.carModelForm = this.fb.group({
      manufacturerId: [this.lockedManufacturerId, Validators.required],
      modelName: ['', [Validators.required, Validators.minLength(1)]]
    });
    if (this.lockedManufacturerId) {
      this.carModelForm.get('manufacturerId')?.disable();
    }
  }

  filteredAndSortedModels = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let models = this.carModels();

    // Filter
    if (searchTerm) {
      models = models.filter(model => 
        model.name.toLowerCase().includes(searchTerm) ||
        model.manufacturerName.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      models = [...models].sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        }

        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return models;
  });

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filter.set(input.value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(currentDir => {
        if (currentDir === 'asc') return 'desc';
        if (currentDir === 'desc') return '';
        return 'asc';
      });
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    if (this.sortDirection() === 'asc') return '▲';
    if (this.sortDirection() === 'desc') return '▼';
    return '';
  }


  async addCarModel(): Promise<void> {
    if (this.carModelForm.valid) {
      // getRawValue(), not .value -- manufacturerId is a disabled control in quick-add-with-locked-
      // manufacturer mode, and disabled controls are omitted from .value.
      const rawValue = this.carModelForm.getRawValue();
      const name = rawValue.modelName?.trim();
      const manufacturerId = rawValue.manufacturerId;
      const manufacturer = this.manufacturers().find(m => m.id === manufacturerId);

      if (name && manufacturerId && manufacturer) {
        try {
          if (this.isEditMode()) {
            // Update existing model
            const editingModel = this.editingModel();
            if (editingModel) {
              await this.carModelService.updateCarModel(editingModel.id, {
                name,
                manufacturerId,
                manufacturerName: manufacturer.name
              });
              this.toastService.showSuccess(this.translate.instant('TOAST.EDIT_SUCCESS'));
              this.cancelEdit();
            }
          } else {
            // Add new model
            const created = await this.carModelService.addCarModel({
              name,
              manufacturerId,
              manufacturerName: manufacturer.name
            });
            this.toastService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
            this.carModelForm.reset({ manufacturerId: this.lockedManufacturerId, modelName: '' });
            // Quick-add dialog mode: hand the newly created model back to CarCardComponent
            // instead of staying open on the list.
            if (this.dialogRef) {
              this.dialogRef.close(created);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to add/update car model', error);
         this.toastService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        }
      }
    } else {
      this.toastService.showWarning(this.translate.instant('TOAST.VALIDATION_ERROR'));
    }
  }

  editCarModel(model: CarModel): void {
    this.isEditMode.set(true);
    this.editingModel.set(model);
    this.carModelForm.patchValue({
      manufacturerId: model.manufacturerId,
      modelName: model.name
    });
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editingModel.set(null);
    this.carModelForm.reset();
  }

  /** No-op unless opened as a dialog -- cancels without creating anything, per the
   * "cancel does nothing" requirement. */
  cancelDialog(): void {
    this.dialogRef?.close();
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  // Fix: Completed the confirmDelete method
  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.carModelService.deleteCarModel(id).subscribe({
        next: () => {
          this.toastService.showSuccess(this.translate.instant('TOAST.DELETE_SUCCESS'));
        },
        error: (error) => {
          console.error('Failed to delete car model', error);
         this.toastService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        }
      });
      this.closeDeleteModal();
    }
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}