import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ManufacturerService } from '../../../../services/manufacturer.service';
import { Manufacturer } from '../../../../types/manufacturer.model';
import { ModalComponent } from '../../../shared/modal/modal.component'; // Corrected import path
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../../services/toast.service';

type SortColumn = keyof Manufacturer | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-manufacturers',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, TranslateModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './manufacturers.component.html',
  styleUrl: './manufacturers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManufacturersComponent implements OnInit {
  private manufacturerService = inject(ManufacturerService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  manufacturers = this.manufacturerService.manufacturers$;
  manufacturerForm!: FormGroup;
  
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  // Edit mode
  isEditMode = signal(false);
  editingManufacturer = signal<Manufacturer | null>(null);
  constructor() { 
    this.doDelete=this.doDelete.bind(this);
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.manufacturerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]]
    });
  }
  filteredAndSortedManufacturers = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let manufacturers = this.manufacturers();

    // Filter
    if (searchTerm) {
      manufacturers = manufacturers.filter(manufacturer => 
        manufacturer.name.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      manufacturers = [...manufacturers].sort((a, b) => {
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

    return manufacturers;
  });

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filter.set(input.value);
  }


  async addManufacturer(): Promise<void> {
    if (this.manufacturerForm.valid) {
      const name = this.manufacturerForm.value.name?.trim();
      if (name) {
        try {
          if (this.isEditMode()) {
            // Update existing manufacturer
            const editingManufacturer = this.editingManufacturer();
            if (editingManufacturer) {
              await this.manufacturerService.updateManufacturer(editingManufacturer.id, { name });
              this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
              this.cancelEdit();
            }
          } else {
            // Add new manufacturer
            await this.manufacturerService.addManufacturer({ name });
            this.toastService.showSuccess('TOAST.ADD_SUCCESS');
            this.manufacturerForm.reset();
          }
        } catch (error) {
          console.error('Failed to add/update manufacturer', error);
          this.toastService.showError('TOAST.SAVE_ERROR');
        }
      }
    } else {
      this.toastService.showWarning('TOAST.VALIDATION_ERROR');
    }
  }

  editManufacturer(manufacturer: Manufacturer): void {
    this.isEditMode.set(true);
    this.editingManufacturer.set(manufacturer);
    this.manufacturerForm.patchValue({
      name: manufacturer.name
    });
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editingManufacturer.set(null);
    this.manufacturerForm.reset();
  }
  async doDelete(id: number): Promise<void> {
    try {
      await this.manufacturerService.deleteManufacturer(id);
    } catch (error) {
      console.error('Failed to delete manufacturer', error);
      alert('Failed to delete manufacturer. Please try again.');
    }
  }
  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  async confirmDelete(): Promise<void> {
    const id = this.itemToDeleteId();
    if (id) {
      try {
        await this.manufacturerService.deleteManufacturer(id);
        this.toastService.showSuccess('TOAST.DELETE_SUCCESS');
        this.closeDeleteModal();
      } catch (error) {
        console.error('Failed to delete manufacturer', error);
        this.toastService.showError('TOAST.SAVE_ERROR');
      }
    }
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
  
}