import { Component, inject, signal, Inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { BatchService } from '../../../services/batch.service';
import { ItemBatch, BatchAllocation } from '../../../models/batch.model';
import { NotificationService } from '../../../services/notification.service';
import { Observable, map, startWith } from 'rxjs';

interface DialogData {
  item: any;
  currentBatchAllocations?: BatchAllocation[];
  totalQuantity: number;
}

@Component({
  selector: 'app-batch-allocation-dialog',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatOptionModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    DxDataGridModule
  ],
  templateUrl: './batch-allocation-dialog.component.html',
  styleUrls: ['./batch-allocation-dialog.component.css']
})
export class BatchAllocationDialogComponent {
  private dialogRef = inject(MatDialogRef<BatchAllocationDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private batchService = inject(BatchService);
  public data = inject(MAT_DIALOG_DATA) as DialogData;
  private notificationService = inject(NotificationService);

  // Available batches for autocomplete
  availableBatches = signal<ItemBatch[]>([]);
  filteredBatches = signal<ItemBatch[]>([]);

  // Batch allocations grid data
  batchAllocations = signal<BatchAllocation[]>([]);

  // Processing state
  isProcessing = signal(false);
  isLoadingBatches = signal(false);

  // Validation
  hasErrors = signal(false);
  errorMessages = signal<string[]>([]);

  // Autocomplete control
  batchSearchControl = new FormControl('');

  // Computed properties
  totalAllocatedQuantity = computed(() =>
    this.batchAllocations().reduce((sum, allocation) => sum + (allocation.quantity || 0), 0)
  );

  quantityDifference = computed(() =>
    this.data.totalQuantity - this.totalAllocatedQuantity()
  );

  isValidAllocation = computed(() =>
    this.totalAllocatedQuantity() === this.data.totalQuantity && this.batchAllocations().length > 0
  );

  constructor() {
    this.initializeBatchAllocations();
    this.loadAvailableBatches();
    this.setupAutocomplete();
  }

  /**
   * Initialize batch allocations from current data
   */
  private initializeBatchAllocations(): void {
    if (this.data.currentBatchAllocations && this.data.currentBatchAllocations.length > 0) {
      this.batchAllocations.set([...this.data.currentBatchAllocations]);
    } else {
      // Start with one empty row
      this.addNewBatchRow();
    }
  }

  /**
   * Load available batches for the item
   */
  private loadAvailableBatches(): void {
    if (!this.data.item?.carId) return;

    this.isLoadingBatches.set(true);
    this.batchService.getAvailableBatchesByItem(this.data.item.carId).subscribe({
      next: (batches) => {
        this.availableBatches.set(batches);
        this.filteredBatches.set(batches);
        this.isLoadingBatches.set(false);
      },
      error: (error) => {
        console.error('Error loading batches:', error);
        this.isLoadingBatches.set(false);
        this.notificationService.errorAlert('Error loading available batches', 'Close');
      }
    });
  }

  /**
   * Setup autocomplete filtering
   */
  private setupAutocomplete(): void {
    this.batchSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterBatches(value || ''))
    ).subscribe(filtered => {
      this.filteredBatches.set(filtered);
    });
  }

  /**
   * Filter batches based on search input
   */
  private filterBatches(value: string): ItemBatch[] {
    const filterValue = value.toLowerCase();
    return this.availableBatches().filter(batch =>
      batch.batchNo.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Add a new empty batch allocation row
   */
  addNewBatchRow(): void {
    const newAllocation: BatchAllocation = {
      batchNo: '',
      productionDate: new Date(),
      expiryDate: new Date(),
      quantity: 0
    };
    this.batchAllocations.update(allocations => [...allocations, newAllocation]);
  }

  /**
   * Remove a batch allocation row
   */
  removeBatchRow(index: number): void {
    this.batchAllocations.update(allocations =>
      allocations.filter((_, i) => i !== index)
    );
    this.validateAllocations();
  }

  /**
   * Handle batch selection from autocomplete
   */
  onBatchSelected(allocation: BatchAllocation, selectedBatch: ItemBatch): void {
    const batch = this.availableBatches().find(b => b.id === selectedBatch.id);
    if (batch) {
      allocation.batchId = batch.id;
      allocation.batchNo = batch.batchNo;
      allocation.productionDate = new Date(batch.productionDate);
      allocation.expiryDate = new Date(batch.expiryDate);
      // Set maximum available quantity
      allocation.allocatedQuantity = batch.availableQuantity;
    }
  }

  /**
   * Create a new batch from dialog
   */
  createNewBatchFromDialog(): void {
    // Create a new batch allocation object
    const newAllocation: BatchAllocation = {
      batchNo: '',
      productionDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      quantity: this.data.totalQuantity // Default to required quantity
    };

    // Get batch number from user
    const batchNo = prompt('Enter batch number:', '');
    if (!batchNo || !batchNo.trim()) {
      this.notificationService.warningAlert('Batch number is required', 'Close');
      return;
    }

    newAllocation.batchNo = batchNo.trim();

    // Get production date
    const productionDateStr = prompt('Enter production date (YYYY-MM-DD):', newAllocation.productionDate.toISOString().split('T')[0]);
    if (productionDateStr) {
      const prodDate = new Date(productionDateStr);
      if (!isNaN(prodDate.getTime())) {
        newAllocation.productionDate = prodDate;
      }
    }

    // Get expiry date
    const expiryDateStr = prompt('Enter expiry date (YYYY-MM-DD):', newAllocation.expiryDate.toISOString().split('T')[0]);
    if (expiryDateStr) {
      const expDate = new Date(expiryDateStr);
      if (!isNaN(expDate.getTime())) {
        newAllocation.expiryDate = expDate;
      }
    }

    // Get quantity
    const quantityStr = prompt('Enter batch quantity:', newAllocation.quantity.toString());
    if (quantityStr) {
      const qty = parseInt(quantityStr, 10);
      if (!isNaN(qty) && qty > 0) {
        newAllocation.quantity = qty;
      }
    }

    // Call the createNewBatch method
    this.createNewBatch(newAllocation);
  }

  /**
   * Create a new batch
   */
  createNewBatch(allocation: BatchAllocation): void {
    if (!allocation.batchNo.trim()) {
      this.notificationService.warningAlert('Please enter a batch number', 'Close');
      return;
    }

    // Check if batch already exists
    this.batchService.batchExists(this.data.item.carId, allocation.batchNo).subscribe({
      next: (exists) => {
        if (exists) {
          this.notificationService.warningAlert('Batch number already exists', 'Close');
          return;
        }

        // Create new batch
        const newBatch: Omit<ItemBatch, 'id' | 'createdAt' | 'updatedAt'> = {
          itemId: this.data.item.carId,
          batchNo: allocation.batchNo,
          productionDate: allocation.productionDate,
          expiryDate: allocation.expiryDate,
          quantity: allocation.quantity,
          availableQuantity: allocation.quantity,
          status: 'Active'
        };

        this.batchService.createBatch(newBatch).subscribe({
          next: (createdBatch) => {
            this.availableBatches.update(batches => [...batches, createdBatch]);
            allocation.batchId = createdBatch.id;
            this.notificationService.successAlert('Batch created successfully', 'Close');
          },
          error: (error) => {
            console.error('Error creating batch:', error);
            this.notificationService.errorAlert('Error creating batch', 'Close');
          }
        });
      },
      error: (error) => {
        console.error('Error checking batch existence:', error);
        this.notificationService.errorAlert('Error validating batch', 'Close');
      }
    });
  }

  /**
   * Validate all batch allocations
   */
  validateAllocations(): void {
    const allocations = this.batchAllocations();
    const errors: string[] = [];

    // Check for empty batch numbers
    const emptyBatches = allocations.filter(a => !a.batchNo.trim());
    if (emptyBatches.length > 0) {
      errors.push(`${emptyBatches.length} batch(es) have empty batch numbers`);
    }

    // Check for invalid quantities
    const invalidQuantities = allocations.filter(a => !a.quantity || a.quantity <= 0);
    if (invalidQuantities.length > 0) {
      errors.push(`${invalidQuantities.length} batch(es) have invalid quantities`);
    }

    // Check for duplicate batch numbers
    const batchNumbers = allocations.map(a => a.batchNo.toLowerCase());
    const duplicates = batchNumbers.filter((batch, index) => batchNumbers.indexOf(batch) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate batch numbers found: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check total quantity
    const totalQuantity = this.totalAllocatedQuantity();
    if (totalQuantity !== this.data.totalQuantity) {
      errors.push(`Total allocated quantity (${totalQuantity}) must equal required quantity (${this.data.totalQuantity})`);
    }

    // Check expiry dates
    const expiredBatches = allocations.filter(a => new Date(a.expiryDate) < new Date());
    if (expiredBatches.length > 0) {
      errors.push(`${expiredBatches.length} batch(es) have expired`);
    }

    this.errorMessages.set(errors);
    this.hasErrors.set(errors.length > 0);
  }

  /**
   * Save batch allocations
   */
  save(): void {
    this.validateAllocations();

    if (this.hasErrors()) {
      return;
    }

    this.isProcessing.set(true);

    // Filter out empty allocations and prepare data
    const validAllocations = this.batchAllocations()
      .filter(allocation => allocation.batchNo.trim() && allocation.quantity > 0)
      .map(allocation => ({
        batchId: allocation.batchId,
        batchNo: allocation.batchNo,
        productionDate: allocation.productionDate,
        expiryDate: allocation.expiryDate,
        quantity: allocation.quantity
      }));

    this.dialogRef.close(validAllocations);
  }

  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Get status text for validation display
   */
  getStatusText(): string {
    const diff = this.quantityDifference();
    if (diff === 0) {
      return 'Complete';
    } else if (diff > 0) {
      return `${diff} remaining`;
    } else {
      return `${Math.abs(diff)} excess`;
    }
  }

  /**
   * Get status color for validation display
   */
  getStatusColor(): string {
    if (this.quantityDifference() === 0) {
      return '#4caf50'; // Green
    } else if (this.quantityDifference() > 0) {
      return '#ff9800'; // Orange
    } else {
      return '#f44336'; // Red
    }
  }

  /**
   * Display function for autocomplete
   */
  displayBatch(batch: ItemBatch): string {
    return batch ? batch.batchNo : '';
  }
}