import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { Manufacturer } from '../../../types/manufacturer.model';
import { ModalComponent } from '../../shared/modal/modal.component'; // Corrected import path
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

type SortColumn = keyof Manufacturer | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-manufacturers',
  standalone: true,
  imports: [FormsModule, ModalComponent, DxDataGridModule, TranslateModule],
  templateUrl: './manufacturers.component.html',
  styleUrl: './manufacturers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManufacturersComponent {
  private manufacturerService = inject(ManufacturerService);

  manufacturers = this.manufacturerService.manufacturers$;
  newManufacturerName = signal('');
  
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);
  constructor() { 
    this.doDelete=this.doDelete.bind(this);
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
    const name = this.newManufacturerName().trim();
    if (name) {
      try {
        await this.manufacturerService.addManufacturer({ name });
        this.newManufacturerName.set('');
      } catch (error) {
        console.error('Failed to add manufacturer', error);
        alert('Failed to add manufacturer. Please try again.');
      }
    }
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
        this.closeDeleteModal();
      } catch (error) {
        console.error('Failed to delete manufacturer', error);
        alert('Failed to delete manufacturer. Please try again.');
      }
    }
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
  
}