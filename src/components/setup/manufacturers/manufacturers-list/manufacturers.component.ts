import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ManufacturerService } from '../../../../services/manufacturer.service';
import { Manufacturer } from '../../../../models/manufacturer.model';
import { ModalComponent } from '../../../shared/modal/modal.component'; // Corrected import path
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../../services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

type SortColumn = keyof Manufacturer | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-manufacturers',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, TranslateModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatDialogModule],
  templateUrl: './manufacturers.component.html',
  styleUrl: './manufacturers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManufacturersComponent implements OnInit {
  private manufacturerService = inject(ManufacturerService);
  private fb = inject(FormBuilder);
  private toastService = inject(NotificationService);
  private translate = inject(TranslateService);
  /** Present only when this component is opened via MatDialog.open(ManufacturersComponent, ...)
   * (see CarCardComponent's "+" button next to the Manufacturer dropdown) -- absent when it's
   * loaded as the routed /setup/manufacturers page, which is the existing behavior. */
  private dialogRef = inject(MatDialogRef<ManufacturersComponent, Manufacturer | undefined>, { optional: true });

  /** True only in dialog mode -- hides the list/search/sort table so the popup is just the
   * quick-add form, without touching how the routed page renders. */
  isQuickAddDialog = !!this.dialogRef;

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

  /** Preview for the Logo upload -- base64 data URI, same pattern as the Vehicle Card's photo
   *  upload (car-card.component.ts's onFileSelected). */
  logoPreview = signal<string | null>(null);

  private initForm(): void {
    this.manufacturerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      nameAr: [''],
      nameEn: [''],
      logo: [null as string | null],
      countryOfOrigin: [''],
      isActive: [true]
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.showError(this.translate.instant('MANUFACTURERS.SELECT_IMAGE_FILE_ERROR'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.showError(this.translate.instant('MANUFACTURERS.LOGO_TOO_LARGE_ERROR'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.manufacturerForm.patchValue({ logo: base64 });
      this.logoPreview.set(base64);
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.manufacturerForm.patchValue({ logo: null });
    this.logoPreview.set(null);
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
      const formValue = this.manufacturerForm.value;
      const name = formValue.name?.trim();
      if (name) {
        const payload: Omit<Manufacturer, 'id'> = {
          name,
          nameAr: formValue.nameAr?.trim() || undefined,
          nameEn: formValue.nameEn?.trim() || undefined,
          logo: formValue.logo,
          countryOfOrigin: formValue.countryOfOrigin?.trim() || undefined,
          isActive: formValue.isActive
        };
        try {
          if (this.isEditMode()) {
            // Update existing manufacturer
            const editingManufacturer = this.editingManufacturer();
            if (editingManufacturer) {
              await this.manufacturerService.updateManufacturer(editingManufacturer.id, payload);
              this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
              this.cancelEdit();
            }
          } else {
            // Add new manufacturer
            const created = await this.manufacturerService.addManufacturer(payload);
            this.toastService.showSuccess('TOAST.ADD_SUCCESS');
            this.manufacturerForm.reset({ isActive: true });
            this.logoPreview.set(null);
            // Quick-add dialog mode: hand the newly created manufacturer back to the caller
            // (CarCardComponent) instead of staying open on the list -- routed page usage is
            // unaffected since dialogRef is undefined there.
            if (this.dialogRef) {
              this.dialogRef.close(created);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to add/update manufacturer', error);
         this.toastService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        }
      }
    } else {
      this.toastService.showWarning('TOAST.VALIDATION_ERROR');
    }
  }

  /** No-op unless opened as a dialog -- cancels without creating anything, per the
   * "cancel does nothing" requirement. */
  cancelDialog(): void {
    this.dialogRef?.close();
  }

  editManufacturer(manufacturer: Manufacturer): void {
    this.isEditMode.set(true);
    this.editingManufacturer.set(manufacturer);
    this.manufacturerForm.patchValue({
      name: manufacturer.name,
      nameAr: manufacturer.nameAr ?? '',
      nameEn: manufacturer.nameEn ?? '',
      logo: manufacturer.logo ?? null,
      countryOfOrigin: manufacturer.countryOfOrigin ?? '',
      isActive: manufacturer.isActive ?? true
    });
    this.logoPreview.set(manufacturer.logo ?? null);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editingManufacturer.set(null);
    this.manufacturerForm.reset({ isActive: true });
    this.logoPreview.set(null);
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
       this.toastService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
      }
    }
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
  
}