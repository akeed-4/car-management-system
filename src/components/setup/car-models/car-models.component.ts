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
import { TranslateModule } from '@ngx-translate/core';
import { CarModelService } from '../../../services/car-model.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { CarModel } from '../../../types/car-model.model';

type SortColumn = keyof CarModel | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-car-models',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatGridListModule, MatIconModule, TranslateModule, ModalComponent],
  templateUrl: './car-models.component.html',
  styleUrl: './car-models.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarModelsComponent implements OnInit {
  private carModelService = inject(CarModelService);
  private manufacturerService = inject(ManufacturerService);
  private currentSettingService = inject(CurrentSettingService);
  private fb = inject(FormBuilder);

  carModels = toSignal(this.carModelService.getCarModels(), { initialValue: [] });
  manufacturers = this.manufacturerService.manufacturers$;
  cardLayout$ = this.currentSettingService.getCardLayout(1);

  carModelForm!: FormGroup;

  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.carModelForm = this.fb.group({
      manufacturerId: [null, Validators.required],
      modelName: ['', [Validators.required, Validators.minLength(1)]]
    });
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


  addCarModel(): void {
    if (this.carModelForm.valid) {
      const name = this.carModelForm.value.modelName?.trim();
      const manufacturerId = this.carModelForm.value.manufacturerId;
      const manufacturer = this.manufacturers().find(m => m.id === manufacturerId);

      if (name && manufacturerId && manufacturer) {
        this.carModelService.addCarModel({ 
          name, 
          manufacturerId,
          manufacturerName: manufacturer.name 
        });
        this.carModelForm.reset();
      }
    }
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  // Fix: Completed the confirmDelete method
  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.carModelService.deleteCarModel(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}