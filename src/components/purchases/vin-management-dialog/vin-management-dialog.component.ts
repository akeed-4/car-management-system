import { Component, Inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { ToastService } from '../../../services/toast.service';
import { VinService } from '../../../services/vin.service';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';

export interface VinEntry {
  vin: string;
  color?: string;
  engineNumber?: string;
  status?: string;
}

export interface VinManagementDialogData {
  item: {
    carDescription: string;
    carId: number;
  };
  requiredQuantity: number;
  existingVins?: VinEntry[];
  purchaseInvoiceItemId?: number;
  showroomId?: number;
  userId?: number;
}

@Component({
  selector: 'app-vin-management-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    TranslateModule,
    DxDataGridModule
  ],
  templateUrl: './vin-management-dialog.component.html',
  styleUrl: './vin-management-dialog.component.css'
})
export class VinManagementDialogComponent {
  // State signals
  vinEntries = signal<VinEntry[]>([]);
  isProcessing = signal(false);
  errorMessages = signal<string[]>([]);
  totalRequired = signal(0);

  // Computed signals
  totalReceived = computed(() => this.vinEntries().length);
  totalRemaining = computed(() => this.totalRequired() - this.totalReceived());
  
  statusColor = computed(() => {
    const remaining = this.totalRemaining();
    if (remaining === 0) return '#4caf50'; // Green
    if (remaining > 0) return '#ff9800'; // Orange
    return '#f44336'; // Red (over-allocated)
  });

  statusText = computed(() => {
    const remaining = this.totalRemaining();
    if (remaining === 0) return this.translate.instant('VIN_MANAGEMENT.STATUS_COMPLETE');
    if (remaining > 0) return this.translate.instant('VIN_MANAGEMENT.STATUS_INCOMPLETE');
    return this.translate.instant('VIN_MANAGEMENT.STATUS_OVER');
  });

  hasErrors = computed(() => this.errorMessages().length > 0);

  constructor(
    public dialogRef: MatDialogRef<VinManagementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VinManagementDialogData,
    private translate: TranslateService,
    private toastService: ToastService,
    private vinService: VinService,
    private purchaseCycleService: PurchaseCycleService
  ) {
    // Initialize total required quantity
    this.totalRequired.set(data.requiredQuantity);
    
    // Initialize with existing VINs if provided
    if (data.existingVins && data.existingVins.length > 0) {
      this.vinEntries.set([...data.existingVins]);
    }
  }

  /**
   * Add a new empty VIN row
   */
  addVinRow(): void {
    const newVin: VinEntry = {
      vin: '',
      color: '',
      engineNumber: '',
      status: this.translate.instant('VIN_MANAGEMENT.IN_STOCK')
    };
    this.vinEntries.update(vins => [...vins, newVin]);
  }

  /**
   * Remove a VIN row by index
   */
  removeVinRow = (e: any): void => {
    const rowData = e.row.data;
    this.vinEntries.update(vins => vins.filter(v => v.vin !== rowData.vin));
  };

  /**
   * Auto-generate VINs (placeholder for actual implementation)
   */
  autoGenerateVins(): void {
    this.isProcessing.set(true);
    
    // Simulate auto-generation
    setTimeout(() => {
      const remaining = this.totalRemaining();
      if (remaining <= 0) {
        this.toastService.showWarning(this.translate.instant('VIN_MANAGEMENT.NO_GENERATION_NEEDED'));
        this.isProcessing.set(false);
        return;
      }

      const generatedVins: VinEntry[] = [];
      for (let i = 0; i < remaining; i++) {
        generatedVins.push({
          vin: `AUTO-${Date.now()}-${i}`,
          color: '',
          engineNumber: '',
          status: this.translate.instant('VIN_MANAGEMENT.IN_STOCK')
        });
      }

      this.vinEntries.update(vins => [...vins, ...generatedVins]);
      this.isProcessing.set(false);
      this.toastService.showSuccess(this.translate.instant('VIN_MANAGEMENT.GENERATED_SUCCESS'));
    }, 1000);
  }

  /**
   * Import VINs from Excel file
   */
  importFromExcel(): void {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.isProcessing.set(true);
        // TODO: Implement actual Excel import logic
        // For now, just show a message
        setTimeout(() => {
          this.toastService.showInfo(this.translate.instant('VIN_MANAGEMENT.IMPORT_FEATURE_COMING_SOON'));
          this.isProcessing.set(false);
        }, 500);
      }
    };
    
    input.click();
  }

  /**
   * Validate all VIN entries
   */
  validateVins(): void {
    this.errorMessages.set([]);
    const errors: string[] = [];
    const vins = this.vinEntries();

    // Check if count matches
    if (vins.length !== this.totalRequired()) {
      errors.push(this.translate.instant('VIN_MANAGEMENT.ERROR_COUNT_MISMATCH'));
    }

    // Check for empty VINs
    const emptyVins = vins.filter(v => !v.vin || v.vin.trim() === '');
    if (emptyVins.length > 0) {
      errors.push(this.translate.instant('VIN_MANAGEMENT.ERROR_EMPTY_VINS', { count: emptyVins.length }));
    }

    // Check for duplicate VINs
    const vinSet = new Set();
    const duplicates = vins.filter(v => {
      if (vinSet.has(v.vin)) return true;
      vinSet.add(v.vin);
      return false;
    });
    if (duplicates.length > 0) {
      errors.push(this.translate.instant('VIN_MANAGEMENT.ERROR_DUPLICATE_VINS'));
    }

    this.errorMessages.set(errors);

    if (errors.length === 0) {
      this.toastService.showSuccess(this.translate.instant('VIN_MANAGEMENT.VALIDATION_SUCCESS'));
    } else {
      this.toastService.showError(this.translate.instant('VIN_MANAGEMENT.VALIDATION_FAILED'));
    }
  }

  /**
   * Check if current allocation is valid
   */
  isValidAllocation(): boolean {
    const vins = this.vinEntries();
    return vins.length === this.totalRequired() && 
           vins.every(v => v.vin && v.vin.trim() !== '');
  }

  /**
   * Save VIN entries and close dialog
   */
  save(): void {
    if (!this.isValidAllocation()) {
      this.validateVins();
      return;
    }

    // Check if we have the required parameters for API call
    if (this.data) {
      this.isProcessing.set(true);
      const vinNumbers = this.vinEntries().map(v => v.vin);
      this.vinService.addVins(vinNumbers, this.data.item.carId).subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          this.toastService.showSuccess(this.translate.instant('VIN_MANAGEMENT.SAVE_SUCCESS'));
          // Update car status to Available after adding VINs
          this.purchaseCycleService.updateCarStatusToAvailable(this.data.item.carId).subscribe({
            next: () => {
              console.log('Car status updated to Available');
            },
            error: (error) => {
              console.error('Error updating car status:', error);
            }
          });
          this.dialogRef.close({
            vins: this.vinEntries(),
            carId: this.data.item.carId,
            apiResponse: response
          });
        },
        error: (error) => {
          this.isProcessing.set(false);
          console.error('Error saving VINs:', error);
          this.toastService.showError(this.translate.instant('VIN_MANAGEMENT.SAVE_ERROR'));
        }
      });
    } else {
      // If no API parameters, just close with data (backward compatibility)
      this.dialogRef.close({
        vins: this.vinEntries(),
        carId: this.data.item.carId
      });
    }
  }

  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close(null);
  }
}
