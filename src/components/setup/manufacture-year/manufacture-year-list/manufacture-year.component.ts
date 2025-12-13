import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ManufactureYearService } from '../../../../services/manufacture-year.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-manufacture-year',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatGridListModule, MatIconModule, TranslateModule, ModalComponent],
  templateUrl: './manufacture-year.component.html',
  styleUrl: './manufacture-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManufactureYearComponent implements OnInit {
  private yearService = inject(ManufactureYearService);
  private currentSettingService = inject(CurrentSettingService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  years = this.yearService.years$;
  yearForm!: FormGroup;
  cardLayout$ = this.currentSettingService.getCardLayout(1);

  // Edit mode
  isEditMode = signal(false);
  editingYear = signal<number | null>(null);

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDelete = signal<number | null>(null);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.yearForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]]
    });
  }
  async addYear(): Promise<void> {
    if (this.yearForm.valid) {
      const year = this.yearForm.value.year;
      if (year && year > 1900 && year < 2100) {
        try {
          if (this.isEditMode()) {
            // Update existing year
            const editingYear = this.editingYear();
            if (editingYear !== null) {
              await this.yearService.updateYear(editingYear, year);
              this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
              this.cancelEdit();
            }
          } else {
            // Add new year
            await this.yearService.addYear(year);
            this.toastService.showSuccess('TOAST.ADD_SUCCESS');
            this.yearForm.reset({ year: new Date().getFullYear() });
          }
        } catch (error) {
          console.error('Failed to add/update year', error);
          this.toastService.showError('TOAST.SAVE_ERROR');
        }
      }
    } else {
      this.toastService.showWarning('TOAST.VALIDATION_ERROR');
    }
  }

  editYear(year: number): void {
    this.isEditMode.set(true);
    this.editingYear.set(year);
    this.yearForm.patchValue({
      year: year
    });
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editingYear.set(null);
    this.yearForm.reset({ year: new Date().getFullYear() });
  }

  requestDelete(year: number): void {
    this.itemToDelete.set(year);
    this.isDeleteModalOpen.set(true);
  }

  async confirmDelete(): Promise<void> {
    const year = this.itemToDelete();
    if (year !== null) {
      try {
        await this.yearService.deleteYear(year);
        this.toastService.showSuccess('TOAST.DELETE_SUCCESS');
        this.closeDeleteModal();
      } catch (error) {
        console.error('Failed to delete year', error);
        this.toastService.showError('TOAST.SAVE_ERROR');
      }
    }
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }
}