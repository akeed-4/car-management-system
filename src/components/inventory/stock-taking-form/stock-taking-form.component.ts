import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { StockTakeService } from '../../../services/stock-take.service';
import { StockTake } from '../../../models/stock-take.model';
import { StockTakeItem } from '../../../models/stock-take-item.model';
import { TranslateModule } from '@ngx-translate/core';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { DxDataGridModule } from 'devextreme-angular';
import { CarSelectionDialogComponent, SalesCarSelectionCard } from '../../sales/car-selection-dialog/car-selection-dialog.component';
import { buildVehicleDescription } from '../../../models/vehicle-description';
import { StoreAccountingConfigurationService } from '../../../services/store-accounting-configuration.service';
import { warnIfStoreNotConfigured } from '../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { StoreContextService } from '../../../services/store-context.service';
import { resolveStoreDisplayName } from '../../../models/store-display.util';
import { AccountingService, DefaultAccountKind } from '../../accounting/accounting.service';
import { DefaultAccountTracker } from '@/src/components/shared/default-account/default-account.helper';
import { Account } from '../../accounting/models';
import { AccountAutocompleteComponent } from '../../shared/account-autocomplete/account-autocomplete.component';
import { NotificationService } from '../../../services/notification.service';

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
    MatTooltipModule,
    CarSelectionDialogComponent,
    AccountAutocompleteComponent,
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
  private dialog = inject(MatDialog);
  private storeAccountingConfigService = inject(StoreAccountingConfigurationService);
  private storeContext = inject(StoreContextService);
  private accountingService = inject(AccountingService);
  private notificationService = inject(NotificationService);
  stockTakeForm!: FormGroup;
  items = signal<StockTakeItem[]>([]);

  /** true once the loaded document is Approved -- the account fields (and the rest of the form)
   *  become read-only, matching how purchase-additional-cost-form locks a non-Draft record. */
  locked = signal(false);
  postableAccounts = signal<Account[]>([]);

  // ── Default account + manual override (see DefaultAccountTracker) ──────────────────────────
  private inventoryAccountTracker!: DefaultAccountTracker;
  private inventoryAdjustmentAccountTracker!: DefaultAccountTracker;
  inventoryAccountManuallyChanged = signal(false);
  inventoryAdjustmentAccountManuallyChanged = signal(false);
  /** Read-only label for the (no-longer-user-editable) Store field -- resolves the form's storeId
   *  against every store the caller is authorized for, so an edit-mode document keeps showing its
   *  real, originally-saved store name even if that store isn't the caller's current one. */
  currentStoreName = computed(() => resolveStoreDisplayName(
    this.storeContext.memberships(),
    this.stockTakeForm?.get('storeId')?.value ?? null,
    this.storeContext.current()?.nameAr,
  ));

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
    this.accountingService.getPostableAccounts().subscribe(accounts => this.postableAccounts.set(accounts));

    this.inventoryAccountTracker = new DefaultAccountTracker(this.accountingService, this.stockTakeForm.get('inventoryAccountId') as FormControl);
    this.inventoryAdjustmentAccountTracker = new DefaultAccountTracker(this.accountingService, this.stockTakeForm.get('inventoryAdjustmentAccountId') as FormControl);
    this.stockTakeForm.get('inventoryAccountId')?.valueChanges.subscribe(() =>
      this.inventoryAccountManuallyChanged.set(this.inventoryAccountTracker.manuallyChanged));
    this.stockTakeForm.get('inventoryAdjustmentAccountId')?.valueChanges.subscribe(() =>
      this.inventoryAdjustmentAccountManuallyChanged.set(this.inventoryAdjustmentAccountTracker.manuallyChanged));
    // Recalculate whenever the Store changes (there's no Store picker today, but this keeps the
    // default correct if that ever changes, and covers the initial resolve below).
    this.stockTakeForm.get('storeId')?.valueChanges.subscribe(() => this.recalculateAccountDefaults());

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
    } else {
      // Heads-up only: warns immediately if the current Showroom has no active
      // StoreAccountingConfiguration, instead of only finding out after Save fails server-side.
      const initialStoreId = this.stockTakeForm.get('storeId')?.value;
      if (initialStoreId) {
        this.warnIfCurrentStoreNotConfigured(initialStoreId);
        this.recalculateAccountDefaults();
      }
    }
  }

  private initForm() {
    this.stockTakeForm = new FormGroup({
      documentName: new FormControl('', Validators.required),
      documentDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      createdBy: new FormControl('', Validators.required),
      notes: new FormControl(''),
      status: new FormControl('Draft', Validators.required),
      // No Store picker anymore -- a new document always belongs to the caller's current Showroom.
      storeId: new FormControl(this.storeContext.current()?.storeId ?? '', Validators.required),
      // Optional overrides: left null, the backend derives both from the Store's accounting
      // configuration at approval time (StockService.UpdateStockTakeStatusAsync).
      inventoryAccountId: new FormControl<number | null>(null),
      inventoryAdjustmentAccountId: new FormControl<number | null>(null)
    });
  }

  private recalculateAccountDefaults(): void {
    const storeId = this.stockTakeForm.get('storeId')?.value;
    if (!storeId) return;
    this.inventoryAccountTracker.recalculate({ kind: DefaultAccountKind.StockAdjustmentInventory, storeId });
    this.inventoryAdjustmentAccountTracker.recalculate({ kind: DefaultAccountKind.StockAdjustmentGainLoss, storeId });
  }

  /** "Reset to Default" action next to an overridden account field. */
  resetInventoryAccountToDefault(): void {
    this.inventoryAccountTracker.reset();
    this.inventoryAccountManuallyChanged.set(false);
  }

  resetInventoryAdjustmentAccountToDefault(): void {
    this.inventoryAdjustmentAccountTracker.reset();
    this.inventoryAdjustmentAccountManuallyChanged.set(false);
  }

  private populateForm(stockTake: StockTake) {
    this.stockTakeForm.patchValue({
      documentName: stockTake.documentName,
      documentDate: stockTake.documentDate,
      createdBy: stockTake.createdBy,
      notes: stockTake.notes,
      status: stockTake.status,
      storeId: stockTake.storeId,
      inventoryAccountId: stockTake.inventoryAccountId ?? null,
      inventoryAdjustmentAccountId: stockTake.inventoryAdjustmentAccountId ?? null
    });
    // A loaded document's stored override (if any) must display as-is, never be silently
    // recomputed/overwritten by the tracker's own recalculate() -- see sales-invoice-form.component.ts
    // for the same edge case (constructor's valueChanges subscription never sees a patchValue call
    // that happens after construction, so a real saved value must be marked manual explicitly).
    if (stockTake.inventoryAccountId != null) {
      this.inventoryAccountTracker.markAsManuallyChanged();
      this.inventoryAccountManuallyChanged.set(true);
    }
    if (stockTake.inventoryAdjustmentAccountId != null) {
      this.inventoryAdjustmentAccountTracker.markAsManuallyChanged();
      this.inventoryAdjustmentAccountManuallyChanged.set(true);
    }
    this.items.set([...stockTake.items]);
    if (stockTake.storeId) {
      this.warnIfCurrentStoreNotConfigured(stockTake.storeId);
      this.recalculateAccountDefaults();
    }

    // Approved stock takes have already posted their adjustment journal -- the account fields (and
    // the rest of the form) become read-only, matching purchase-additional-cost-form's lock rule.
    if (stockTake.status === 'Approved') {
      this.locked.set(true);
      this.stockTakeForm.disable();
    }
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

  /** Heads-up only: warns the user immediately if the Store has no active
   * StoreAccountingConfiguration, instead of only finding out after Save fails server-side. Called
   * once the storeId is known (current Showroom for a new document, saved value for an edit) --
   * there's no more Store dropdown to hang a (selectionChange) handler off of. */
  private warnIfCurrentStoreNotConfigured(storeId: number | null): void {
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, this.currentStoreName()).subscribe();
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
      const cars = this.allCars();
      const selectedCar = cars.find(c => c.id === event.value);
      if (!selectedCar) return;

      const description = buildVehicleDescription(selectedCar);
      // Update grid cell directly so the change is visible immediately
      try {
        event.component.cellValue(event.rowIndex, 'itemName', description);
      } catch (e) {
        // some grid events may not provide component or rowIndex — ignore safely
      }

      this.items.update(items => {
        const updatedItems = [...items];
        const idx = event.rowIndex ?? updatedItems.length - 1;
        updatedItems[idx] = {
          ...updatedItems[idx],
          itemId: Number(event.value) || 0,
          itemName: description,
          category: selectedCar.condition ?? 'Unknown',
          unitCost: Number(selectedCar.purchasePrice) || 0,
          quantityCounted: 1,
          totalCost: (Number(selectedCar.purchasePrice) || 0) * 1,
          notes: `VIN: ${selectedCar.vin ?? 'N/A'} | Plate: ${selectedCar.plateNumber ?? 'N/A'}`
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
      data: {},
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addCarToStockTake(result);
      }
    });
  }

  // Add selected car to the stock-taking items grid (pre-fill fields). The dialog with no
  // pre-supplied `cars` always resolves via the store-stock API, so the result is a
  // StoreCarStockDto-shaped card -- it has no condition/purchasePrice (those are inventory-Car-only
  // fields), so those two default rather than reading nonexistent properties.
  addCarToStockTake(car: SalesCarSelectionCard): void {
    // Prevent duplicates by itemId (car.carId)
    const exists = this.items().some(i => i.itemId === car.carId);
    if (exists) {
      this.notificationService.showError('INVENTORY.STOCK_TAKING_FORM.ERROR_ALREADY_ADDED');
      return;
    }

    const description = buildVehicleDescription(car) || car.carDescription || car.carName;
    const newItem: StockTakeItem = {
      itemId: car.carId,
      itemName: description,
      category: '',
      quantityCounted: 1,
      unitCost: Number(car.salesPrice) || 0,
      totalCost: (Number(car.salesPrice) || 0) * 1,
      notes: `VIN: ${car.vin ?? 'N/A'} | Plate: ${car.plateNumber ?? 'N/A'}`
    };

    this.items.update(items => [...items, newItem]);
  }
  saveStockTake() {
    if (this.stockTakeForm.invalid || this.locked()) {
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set('');

    const formValue = this.stockTakeForm.getRawValue();

    if (this.items().length === 0) {
      this.isSaving.set(false);
      this.notificationService.showError('INVENTORY.STOCK_TAKING_FORM.ERROR_NO_ITEMS');
      return;
    }

    // Validate that all rows have an item selected
    if (this.items().some(item => item.itemId === 0)) {
      this.isSaving.set(false);
      this.notificationService.showError('INVENTORY.STOCK_TAKING_FORM.ERROR_SELECT_ITEM');
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
      inventoryAccountId: formValue.inventoryAccountId ?? null,
      inventoryAdjustmentAccountId: formValue.inventoryAdjustmentAccountId ?? null,
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
          this.notificationService.showError('INVENTORY.STOCK_TAKING_FORM.ERROR_UPDATE');
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
          this.notificationService.showError('INVENTORY.STOCK_TAKING_FORM.ERROR_CREATE');
        }
      });
    }
  }
}