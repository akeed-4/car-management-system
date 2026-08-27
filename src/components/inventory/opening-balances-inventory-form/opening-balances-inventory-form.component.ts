import { Component, OnInit, signal, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AccountingService } from '../../accounting/accounting.service';
import { StoreService } from '../../../services/store.service';
import { StoreAccountingConfigurationService } from '../../../services/store-accounting-configuration.service';
import { warnIfStoreNotConfigured } from '../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { BranchContextService } from '../../../services/branch-context.service';
import { scopeStoresToCurrentBranch } from '../../../models/branch-scoped-stores.util';
import { CarSelectionDialogComponent } from '../../purchases/purchase-invoice/car-selection-dialog/car-selection-dialog.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-opening-balances-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    CarSelectionDialogComponent,
  ],
  templateUrl: './opening-balances-inventory-form.component.html',
  styleUrls: ['./opening-balances-inventory-form.component.css']
})
export class OpeningBalancesInventoryFormComponent implements OnInit {

  form: FormGroup;
  isEditing = false;
  editingId: number | null = null;
  isSaving = signal(false);
  successMessage = signal('');

  categories = ['CAR', 'SPARE_PART', 'ACCESSORY'];
  // locations will be provided by StoreService
  stores$ = this.storeService.stores$;

  /** The form's current storeId, kept in sync explicitly (loadExisting + onStoreSelectionChange)
   *  so the Store list can stay scoped to the caller's current branch without losing a
   *  document's already-saved store when editing across a branch boundary. */
  private currentStoreIdValue = signal<number | null>(null);
  /** Template-friendly getter to access the branch-scoped stores array -- never offers a store
   *  outside the user's assigned branch on a new document, while still showing an already-saved
   *  out-of-branch store when editing one. */
  get stores() {
    return scopeStoresToCurrentBranch(this.storeService.stores$(), this.branchContext.current()?.branchId, this.currentStoreIdValue());
  }

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private storeService: StoreService,
    private storeAccountingConfigService: StoreAccountingConfigurationService,
    private branchContext: BranchContextService,
    private injector: Injector
  ) {
    this.form = this.fb.group({
      itemId: ['', Validators.required],
      itemName: ['', Validators.required],
      category: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      totalCost: [{ value: 0, disabled: true }],
      storeId: ['', Validators.required],
      location: [''],
      notes: [''],
      entryDate: [new Date(), Validators.required]
    });

    // Calculate total cost when quantity or unit cost changes
    this.form.get('quantity')?.valueChanges.subscribe(() => this.calculateTotalCost());
    this.form.get('unitCost')?.valueChanges.subscribe(() => this.calculateTotalCost());
  }

  ngOnInit() {
    // Check if editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.isEditing = true;
      this.editingId = id;
      this.loadExisting(id);
    } else {
      // Auto-select the store once the branch-scoped list resolves to exactly one option, so a
      // user whose branch has a single store never has to manually pick it.
      effect(() => {
        const options = this.stores;
        const storeIdControl = this.form.get('storeId');
        if (options.length === 1 && !storeIdControl?.value && !storeIdControl?.dirty) {
          storeIdControl?.setValue(options[0].id);
          this.onStoreSelectionChange(options[0].id);
        }
      }, { injector: this.injector });
    }
  }

  private loadExisting(id: number) {
    this.accountingService.getOpeningBalancesInventory().subscribe({
      next: (balances) => {
        const item = balances.find(b => b.id === id);
        if (item) {
          this.isEditing = true;
          this.editingId = id;
          this.currentStoreIdValue.set(item.storeId ?? null);
          this.form.patchValue({
            itemId: item.itemId,
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            storeId: item.storeId,
            location: item.location,
            notes: item.notes,
            entryDate: item.entryDate ? new Date(item.entryDate) : new Date()
          });
        }
      },
      error: (err) => {
        console.error('Failed to load opening balance for edit', err);
      }
    });
  }

  calculateTotalCost() {
    const quantity = this.form.get('quantity')?.value || 0;
    const unitCost = this.form.get('unitCost')?.value || 0;
    const totalCost = quantity * unitCost;
    this.form.get('totalCost')?.setValue(totalCost);
  }

  onStoreSelectionChange(storeId: number): void {
    this.currentStoreIdValue.set(storeId);
    const selectedStore = this.stores.find(s => s.id === storeId);
    if (selectedStore) {
      this.form.patchValue({ location: selectedStore.nameAr });
    }

    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, selectedStore?.nameAr ?? '').subscribe();
  }

  trackByStoreId(index: number, store: any): number {
    return store.id;
  }

  onSave() {
    if (this.form.valid) {
      this.isSaving.set(true);
      this.successMessage.set('');

      const formValue = this.form.value;
      const balanceData = {
        itemId: formValue.itemId,
        itemName: formValue.itemName,
        category: formValue.category,
        quantity: formValue.quantity,
        unitCost: formValue.unitCost,
        totalCost: formValue.quantity * formValue.unitCost,
        location: formValue.location,
        notes: formValue.notes,
        storeId: formValue.storeId,
        entryDate: formValue.entryDate,
        // model uses 'location' field; no storeId in OpeningBalanceInventory

      };

      if (this.isEditing && this.editingId) {
        // Call update endpoint
        const updateDto: any = { id: this.editingId, ...balanceData };
        this.accountingService.updateOpeningBalanceInventory(this.editingId, updateDto).subscribe({
          next: (updated) => {
            this.isSaving.set(false);
            this.successMessage.set('Opening balance updated successfully!');
            setTimeout(() => {
              this.router.navigate(['/inventory/opening-balances']);
            }, 1500);
          },
          error: (error) => {
            this.isSaving.set(false);
            console.error('Error updating opening balance:', error);
          }
        });
      } else {
        this.accountingService.createOpeningBalanceInventory(balanceData).subscribe({
          next: (newBalance) => {
            this.isSaving.set(false);
            this.successMessage.set('Opening balance created successfully!');
            setTimeout(() => {
              this.router.navigate(['/inventory/opening-balances']);
            }, 1500);
          },
          error: (error) => {
            this.isSaving.set(false);
            console.error('Error creating opening balance:', error);
          }
        });
      }
    }
  }

  openCarSelectionDialog() {
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {},
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.form.patchValue({
          itemId: result.id,
          itemName: result.carName || `${result.make} ${result.model}`
        });
      }
    });
  }

  onCancel() {
    this.router.navigate(['/inventory/opening-balances']);
  }
}