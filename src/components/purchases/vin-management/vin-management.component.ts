import { Component, inject, signal, Inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { VinService, VinData } from '../../../services/vin.service';
import { NotificationService } from '../../../services/notification.service';

/**
 * VIN Entry interface for grid display and editing
 */
export interface VinEntry {
  id?: number;
  vinNumber: string;
  carName: string;
  validationStatus: 'valid' | 'invalid' | 'duplicate';
  isNew?: boolean;
}

interface DialogData {
  item: any;
  currentVins: string[];
}

@Component({
  selector: 'app-vin-management',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DxDataGridModule
  ],
  templateUrl: './vin-management.component.html',
  styleUrls: ['./vin-management.component.css']
})
export class VinManagementComponent {
  private dialogRef = inject(MatDialogRef<VinManagementComponent>);
  private snackBar = inject(MatSnackBar);
  private vinService = inject(VinService);
  public data = inject(MAT_DIALOG_DATA) as DialogData;
  private notificationService = inject(NotificationService);

  // Grid reference
  dataGrid = viewChild<DxDataGridComponent>('dataGrid');

  // Signals
  vinEntries = signal<VinEntry[]>([]);
  isProcessing = signal(false);
  progress = signal(0);
  hasErrors = signal(false);
  errorMessages = signal<string[]>([]);

  // Generate from range
  startVin = '';
  endVin = '';

  // Manual input
  manualVins = '';

  // File upload
  selectedFile: File | null = null;

  constructor() {
    this.initializeVinEntries();
    this.deleteButtonConfig = [
      {
        icon: 'trash',
        onClick: (e: any) => {
          const rowIndex = e.row.rowIndex;
          this.removeRow(rowIndex);
        }
      }
    ];
  }

  deleteButtonConfig: any;

  /**
   * Initialize VIN entries from current VINs
   */
  private initializeVinEntries(): void {
    const carName = this.data?.item?.carDescription || 'Unknown';
    const entries: VinEntry[] = (this.data?.currentVins || []).map((vin: string) => ({
      vinNumber: vin,
      carName: carName,
      validationStatus: this.validateVinFormat(vin) ? 'valid' : 'invalid',
      isNew: false
    }));
    this.vinEntries.set(entries);
  }

  /**
   * Validate VIN format (17 characters, alphanumeric)
   */
  private validateVinFormat(vin: string): boolean {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase());
  }

  /**
   * Generate VINs from a range (startVin to endVin)
   */
  generateFromRange(): void {
    if (!this.startVin || !this.endVin) {
      this.notificationService.warningAlert('Please enter start and end VIN', 'Close');
      return;
    }

    if (!this.validateVinFormat(this.startVin) || !this.validateVinFormat(this.endVin)) {
      this.notificationService.errorAlert('Invalid VIN format. Must be 17 alphanumeric characters.', 'Close');
      return;
    }

    this.isProcessing.set(true);
    this.progress.set(10);

    this.vinService.generateVinRange(
      this.startVin,
      this.endVin,
        this.data?.item?.id,
      
      this.data?.item?.carId
    ).subscribe({
      next: (response: any) => {
        this.progress.set(100);
        const vins = Array.isArray(response) ? response.map(v => v.vinNumber || v) : [];
        this.addVinsToGrid(vins, 'range');
        this.isProcessing.set(false);
        this.startVin = '';
        this.endVin = '';
        this.snackBar.open('VINs generated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error generating VINs:', error);
        this.isProcessing.set(false);
        this.snackBar.open('Error generating VINs', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Handle file selection for Excel upload
   */
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  /**
   * Upload VINs from Excel file
   */
  uploadExcel(): void {
    if (!this.selectedFile) {
      this.notificationService.warningAlert('Please select a file', 'Close');
      return;
    }

    this.isProcessing.set(true);
    this.progress.set(20);

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    if (this.data?.item?.id) {
      formData.append('purchaseInvoiceItemId', this.data.item.id.toString());
    }
    if (this.data?.item?.carId) {
      formData.append('carId', this.data.item.carId.toString());
    }

    this.vinService.importFromExcel(formData).subscribe({
      next: (result: any) => {
        this.progress.set(100);
        this.isProcessing.set(false);

        if (result.vinNumbers && result.vinNumbers.length > 0) {
          this.addVinsToGrid(result.vinNumbers, 'excel');
          this.notificationService.successAlert(`${result.vinNumbers.length} VINs imported successfully`, 'Close');
        }

        if (result.duplicates && result.duplicates.length > 0) {
          this.notificationService.warningAlert(`Duplicates found: ${result.duplicates.join(', ')}`, 'Close');
        }

        if (result.errors && result.errors.length > 0) {
          this.notificationService.errorAlert(`Errors: ${result.errors.join(', ')}`, 'Close');
        }

        this.selectedFile = null;
      },
      error: (error) => {
        console.error('Error importing VINs:', error);
        this.isProcessing.set(false);
        this.notificationService.errorAlert('Error importing VINs from Excel', 'Close');
      }
    });
  }

  /**
   * Add manually entered VINs
   */
  addManualVins(): void {
    if (!this.manualVins.trim()) {
      this.notificationService.warningAlert('Please enter VIN numbers', 'Close');
      return;
    }

    const vins = this.manualVins.split('\n').map(v => v.trim().toUpperCase()).filter(v => v);

    // Validate each VIN format
    const invalidVins = vins.filter(vin => !this.validateVinFormat(vin));
    if (invalidVins.length > 0) {
      this.notificationService.errorAlert(
        `Invalid VIN format: ${invalidVins.join(', ')}. VINs must be 17 alphanumeric characters.`,
        'Close'
      );
      return;
    }

    // Check for duplicates with existing entries
    const currentVins = this.vinEntries().map(e => e.vinNumber.toUpperCase());
    const duplicates = vins.filter(vin => currentVins.includes(vin));

    if (duplicates.length > 0) {
      this.notificationService.warningAlert(`Duplicate VINs already exist: ${duplicates.join(', ')}`, 'Close');
      return;
    }

    this.addVinsToGrid(vins, 'manual');
    this.manualVins = '';
    this.snackBar.open('VINs added successfully', 'Close', { duration: 3000 });
  }

  /**
   * Add VINs to the grid
   */
  private addVinsToGrid(vins: string[], source: 'range' | 'excel' | 'manual'): void {
    const carName = this.data?.item?.carDescription || 'Unknown';
    const currentEntries = this.vinEntries();
    const currentVinNumbers = currentEntries.map(e => e.vinNumber.toUpperCase());

    const newEntries: VinEntry[] = vins
      .filter(vin => !currentVinNumbers.includes(vin.toUpperCase()))
      .map(vin => ({
        vinNumber: vin.toUpperCase(),
        carName: carName,
        validationStatus: this.validateVinFormat(vin) ? 'valid' : 'invalid',
        isNew: true
      }));

    if (newEntries.length > 0) {
      this.vinEntries.set([...currentEntries, ...newEntries]);
    }
  }

  /**
   * Add a new empty row to the grid
   */
  addNewRow(): void {
    const newEntry: VinEntry = {
      vinNumber: '',
      carName: this.data?.item?.carDescription || '',
      validationStatus: 'invalid',
      isNew: true
    };
    this.vinEntries.update(entries => [...entries, newEntry]);
  }

  /**
   * Remove a row from the grid
   */
  removeRow(index: number): void {
    this.vinEntries.update(entries => entries.filter((_, i) => i !== index));
  }

  /**
   * Validate all VINs in the grid
   */
  validateAllVins(): void {
    const entries = this.vinEntries();
    const errors: string[] = [];

    // Check for empty VINs
    const emptyVins = entries.filter(e => !e.vinNumber.trim());
    if (emptyVins.length > 0) {
      errors.push(`${emptyVins.length} VIN(s) are empty`);
    }

    // Check for invalid format
    const invalidVins = entries.filter(e => !this.validateVinFormat(e.vinNumber));
    if (invalidVins.length > 0) {
      errors.push(`${invalidVins.length} VIN(s) have invalid format (must be 17 alphanumeric characters)`);
    }

    // Check for duplicates
    const vinNumbers = entries.map(e => e.vinNumber.toUpperCase());
    const duplicates = vinNumbers.filter((vin, index) => vinNumbers.indexOf(vin) !== index);
    if (duplicates.length > 0) {
      errors.push(`${duplicates.length} duplicate VIN(s) found: ${[...new Set(duplicates)].join(', ')}`);
    }

    if (errors.length > 0) {
      this.errorMessages.set(errors);
      this.hasErrors.set(true);
      this.notificationService.errorAlert(errors.join('\n'), 'Close');
      return;
    }

    this.hasErrors.set(false);
    this.errorMessages.set([]);
    this.notificationService.successAlert('All VINs are valid!', 'Close');

    // Update validation status for all entries
    this.vinEntries.update(entries =>
      entries.map(entry => ({
        ...entry,
        validationStatus: this.checkDuplicates(entry.vinNumber, entries) ? 'duplicate' : 'valid'
      }))
    );
  }

  /**
   * Check if a VIN is a duplicate
   */
  private checkDuplicates(vin: string, entries: VinEntry[]): boolean {
    return entries.filter(e => e.vinNumber.toUpperCase() === vin.toUpperCase()).length > 1;
  }

  /**
   * Get validation status color for display
   */
  getStatusColor(status: 'valid' | 'invalid' | 'duplicate'): string {
    switch (status) {
      case 'valid':
        return '#4caf50';
      case 'invalid':
        return '#f44336';
      case 'duplicate':
        return '#ff9800';
      default:
        return '#999';
    }
  }

  /**
   * Get validation status icon
   */
  getStatusIcon(status: 'valid' | 'invalid' | 'duplicate'): string {
    switch (status) {
      case 'valid':
        return 'check_circle';
      case 'invalid':
        return 'error';
      case 'duplicate':
        return 'warning';
      default:
        return 'help';
    }
  }

  /**
   * Save all VINs
   */
  save(): void {
    // Validate all VINs first
    if (this.hasErrors()) {
      this.validateAllVins();
      return;
    }

    if (this.vinEntries().length === 0) {
      this.notificationService.warningAlert('No VINs to save', 'Close');
      return;
    }

    this.isProcessing.set(true);
    this.progress.set(50);

    const vinData: Omit<VinData, 'id' | 'createdAt' | 'updatedAt'>[] = this.vinEntries()
      .filter(entry => entry.vinNumber.trim())
      .map(entry => ({
        vinNumber: entry.vinNumber.toUpperCase(),
        purchaseInvoiceItemId: this.data?.item?.id,
        carId: this.data?.item?.carId,
        status: 'Active' as const
      }));

    this.vinService.createVins(vinData).subscribe({
      next: (savedVins) => {
        this.progress.set(100);
        this.isProcessing.set(false);
        this.notificationService.successAlert(`${savedVins.length} VINs saved successfully`, 'Close');
        this.dialogRef.close(this.vinEntries().map(e => e.vinNumber));
      },
      error: (error) => {
        console.error('Error saving VINs:', error);
        this.isProcessing.set(false);
        this.notificationService.errorAlert('Error saving VINs', 'Close');
      }
    });
  }

  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close();
  }
}