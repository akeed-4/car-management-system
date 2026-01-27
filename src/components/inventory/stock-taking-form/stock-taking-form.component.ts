import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { StockTakeService } from '../../../services/stock-take.service';
import { StockTake } from '../../../models/stock-take.model';
import { StockTakeItem } from '../../../models/stock-take-item.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreService } from '@/src/services/store.service';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { DxDataGridModule } from 'devextreme-angular';
import { CarSelectionDialogComponent } from '../../sales/car-selection-dialog/car-selection-dialog.component';

@Component({
  selector: 'app-stock-taking-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    DxDataGridModule
    ,MatDialogModule,
    MatProgressSpinnerModule,
    CarSelectionDialogComponent
  ],
  templateUrl: './stock-taking-form.component.html',
  styleUrl: './stock-taking-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private stockTakeService = inject(StockTakeService);
  private translate = inject(TranslateService);
  private storeService = inject(StoreService);
  private dialog = inject(MatDialog);
  stores$ = this.storeService.stores$;
  stockTakeForm!: FormGroup;
  items = signal<StockTakeItem[]>([]);
get stores() {
    return this.storeService.stores$();
  }

  // Table columns
  // displayedColumns = ['car', 'systemQuantity', 'actualQuantity', 'actions'];

  editMode = signal(false);
  pageTitle = signal('إنشاء مستند جرد جديد');
  isSaving = signal(false);
  successMessage = signal('');

  allCars = this.inventoryService.cars$;
  
  // Available items for lookup
  availableItems = computed(() => {
    return this.allCars().map(car => ({
      id: car.id,
      name: `${car.make} ${car.model} ${car.year} - ${car.vin || car.plateNumber || 'N/A'}`
    }));
  });
  
  // Get a list of car IDs that are already in the items list to disable them in dropdowns
  selectedCarIds = computed(() => {
    const items = this.stockTakeForm?.get('items') as FormArray;
    if (!items) return [];
    return items.controls
      .map(control => control.get('carId')?.value)
      .filter(id => id && id !== 0);
  });

  ngOnInit() {
    this.initForm();
    
    // Handle route params for editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل مستند الجرد');
      this.stockTakeService.getStockTakeById(id).subscribe(existingDoc => {
        console.log('Loaded stock take for editing:', existingDoc);
        this.populateForm(existingDoc);
      }, error => {
        console.error('Error loading stock take:', error);
        this.router.navigate(['/inventory/stock-taking']);
      });
    }
  }

  private initForm() {
    this.stockTakeForm = new FormGroup({
      documentName: new FormControl('', Validators.required),
      documentDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      createdBy: new FormControl('', Validators.required),
      notes: new FormControl(''),
      status: new FormControl('Draft', Validators.required),
      storeId: new FormControl('', Validators.required)
    });
  }

  private populateForm(stockTake: StockTake) {
    this.stockTakeForm.patchValue({
      documentName: stockTake.documentName,
      documentDate: stockTake.documentDate,
      createdBy: stockTake.createdBy,
      notes: stockTake.notes,
      status: stockTake.status,
      storeId: stockTake.storeId
    });
    this.items.set([...stockTake.items]);
  }

  addNewItemRow() {
    const newItem: StockTakeItem = {
      itemId: 0,
      itemName: '',
      category: '',
      quantityCounted: 0,
      unitCost: 0,
      totalCost: 0,
      notes: ''
    };
    this.items.update(items => [...items, newItem]);
  }

  removeItem(index: number) {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  updateItemDetails(itemId: number, index: number) {
    // This would typically fetch item details from inventory service
    // For now, we'll assume item details are entered manually
  }

  updateTotalCost(index: number) {
    this.items.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      item.totalCost = item.quantityCounted * item.unitCost;
      return updatedItems;
    });
  }

  onCellValueChanged(event: any) {
    if (event.column.dataField === 'quantityCounted' || event.column.dataField === 'unitCost') {
      const rowIndex = event.rowIndex;
      this.updateTotalCost(rowIndex);
      return;
    }

    if (event.column.dataField === 'itemId') {
      // When itemId changes, update all car-related fields
      const cars = typeof this.allCars === 'function' ? this.allCars() : (this.allCars as any);
      const selectedCar = Array.isArray(cars) ? cars.find(c => c.id === event.value) : undefined;
      if (!selectedCar) return;

      const sel = selectedCar as any;
      // Update grid cell directly so the change is visible immediately
      try {
        event.component.cellValue(event.rowIndex, 'itemName', `${sel.make ?? ''} ${sel.model ?? ''} ${sel.year ?? ''}`.trim());
      } catch (e) {
        // some grid events may not provide component or rowIndex — ignore safely
      }

      this.items.update(items => {
        const updatedItems = [...items];
        const idx = event.rowIndex ?? updatedItems.length - 1;
        updatedItems[idx] = {
          ...updatedItems[idx],
          itemId: Number(event.value) || 0,
          itemName: `${sel.make ?? ''} ${sel.model ?? ''} ${sel.year ?? ''}`.trim(),
          category: sel.condition ?? 'Unknown',
          unitCost: Number(sel.purchasePrice) || 0,
          quantityCounted: 1,
          totalCost: (Number(sel.purchasePrice) || 0) * 1,
          notes: `VIN: ${sel.vin ?? 'N/A'} | Plate: ${sel.plateNumber ?? 'N/A'}`
        };
        return updatedItems;
      });
    }
  }

  // Open the car selection dialog (reused from purchase invoice) and add selected car to items
  toggleCarCards(): void {
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addCarToStockTake(result);
      }
    });
  }

  // Add selected car to the stock-taking items grid (pre-fill fields)
  addCarToStockTake(car: any): void {
    // Prevent duplicates by itemId (car.id)
    const exists = this.items().some(i => i.itemId === car.id);
    if (exists) {
      // Optionally show a toast or alert; keep simple for now
      alert(this.translate.instant ? this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_ALREADY_ADDED') : 'Item already added');
      return;
    }

    const newItem: StockTakeItem = {
      itemId: car.id,
      itemName: `${car.make} ${car.model} ${car.year}`.trim(),
      category: car.condition ?? '',
      quantityCounted: 1,
      unitCost: Number(car.purchasePrice) || 0,
      totalCost: (Number(car.purchasePrice) || 0) * 1,
      notes: `VIN: ${car.vin ?? 'N/A'} | Plate: ${car.plateNumber ?? 'N/A'}`
    };

    this.items.update(items => [...items, newItem]);
  }
  saveStockTake() {
    if (this.stockTakeForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set('');

    const formValue = this.stockTakeForm.value;
    
    if (this.items().length === 0) {
      this.isSaving.set(false);
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_NO_ITEMS'));
      return;
    }

    // Validate that all rows have an item selected
    if (this.items().some(item => item.itemId === 0)) {
      this.isSaving.set(false);
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_SELECT_ITEM'));
      return;
    }

    const stockTakeData: StockTake = {
      id: this.editMode() ? this.route.snapshot.params['id'] : undefined,
      documentName: formValue.documentName,
      documentDate: formValue.documentDate,
      createdBy: formValue.createdBy,
      notes: formValue.notes,
      status: formValue.status,
      storeId: formValue.storeId,
      items: this.items()
    };

    if (this.editMode()) {
      this.stockTakeService.updateStockTake(stockTakeData).subscribe({
        next: (result) => {
          this.isSaving.set(false);
          this.successMessage.set('Stock take updated successfully!');
          setTimeout(() => {
            this.router.navigate(['/inventory/stock-taking']);
          }, 1500);
        },
        error: (error) => {
          this.isSaving.set(false);
          console.error('Error updating stock take:', error);
          alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_UPDATE'));
        }
      });
    } else {
      this.stockTakeService.addStockTake(stockTakeData as Omit<StockTake, 'id'>).subscribe({
        next: (result) => {
          this.isSaving.set(false);
          this.successMessage.set('Stock take created successfully!');
          setTimeout(() => {
            this.router.navigate(['/inventory/stock-taking']);
          }, 1500);
        },
        error: (error) => {
          this.isSaving.set(false);
          console.error('Error creating stock take:', error);
          alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_CREATE'));
        }
      });
    }
  }
}