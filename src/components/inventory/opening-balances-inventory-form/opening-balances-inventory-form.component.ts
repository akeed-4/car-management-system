import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AccountingService, DefaultAccountKind } from '../../accounting/accounting.service';
import { Account } from '../../accounting/models';
import { DefaultAccountTracker } from '@/src/components/shared/default-account/default-account.helper';
import { StoreAccountingConfigurationService } from '../../../services/store-accounting-configuration.service';
import { warnIfStoreNotConfigured } from '../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { StoreContextService } from '../../../services/store-context.service';
import { resolveStoreDisplayName } from '../../../models/store-display.util';
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
    MatTooltipModule,
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

  postableAccounts = signal<Account[]>([]);

  // ── Default account + manual override (see DefaultAccountTracker) ──────────────────────────
  private inventoryAccountTracker!: DefaultAccountTracker;
  private equityAccountTracker!: DefaultAccountTracker;
  inventoryAccountManuallyChanged = signal(false);
  equityAccountManuallyChanged = signal(false);

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private storeAccountingConfigService: StoreAccountingConfigurationService,
    private storeContext: StoreContextService
  ) {
    this.form = this.fb.group({
      itemId: ['', Validators.required],
      itemName: ['', Validators.required],
      category: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      totalCost: [{ value: 0, disabled: true }],
      // No Store picker anymore -- a new item always belongs to the caller's current Showroom.
      storeId: [this.storeContext.current()?.storeId ?? '', Validators.required],
      location: [this.storeContext.current()?.nameAr ?? ''],
      notes: [''],
      entryDate: [new Date(), Validators.required],
      // Optional overrides: left null, the backend derives both from the Store's accounting
      // configuration at posting time (InventoryOpeningBalanceService.GenerateJournalEntryPrivateAsync).
      inventoryAccountId: new FormControl<number | null>(null),
      openingBalanceEquityAccountId: new FormControl<number | null>(null)
    });

    // Calculate total cost when quantity or unit cost changes
    this.form.get('quantity')?.valueChanges.subscribe(() => this.calculateTotalCost());
    this.form.get('unitCost')?.valueChanges.subscribe(() => this.calculateTotalCost());
  }

  ngOnInit() {
    this.accountingService.getPostableAccounts().subscribe(accounts => this.postableAccounts.set(accounts));

    this.inventoryAccountTracker = new DefaultAccountTracker(this.accountingService, this.form.get('inventoryAccountId') as FormControl);
    this.equityAccountTracker = new DefaultAccountTracker(this.accountingService, this.form.get('openingBalanceEquityAccountId') as FormControl);
    this.form.get('inventoryAccountId')?.valueChanges.subscribe(() =>
      this.inventoryAccountManuallyChanged.set(this.inventoryAccountTracker.manuallyChanged));
    this.form.get('openingBalanceEquityAccountId')?.valueChanges.subscribe(() =>
      this.equityAccountManuallyChanged.set(this.equityAccountTracker.manuallyChanged));
    this.form.get('storeId')?.valueChanges.subscribe(() => this.recalculateAccountDefaults());

    // Check if editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.isEditing = true;
      this.editingId = id;
      this.loadExisting(id);
    } else {
      // Heads-up only: warns immediately if the current Showroom has no active
      // StoreAccountingConfiguration, instead of only finding out after Save fails server-side.
      const initialStoreId = this.form.get('storeId')?.value;
      if (initialStoreId) {
        this.warnIfCurrentStoreNotConfigured(initialStoreId);
        this.recalculateAccountDefaults();
      }
    }
  }

  private recalculateAccountDefaults(): void {
    const storeId = this.form.get('storeId')?.value;
    if (!storeId) return;
    this.inventoryAccountTracker.recalculate({ kind: DefaultAccountKind.OpeningBalanceInventory, storeId });
    this.equityAccountTracker.recalculate({ kind: DefaultAccountKind.OpeningBalanceEquity, storeId });
  }

  /** "Reset to Default" action next to an overridden account field. */
  resetInventoryAccountToDefault(): void {
    this.inventoryAccountTracker.reset();
    this.inventoryAccountManuallyChanged.set(false);
  }

  resetEquityAccountToDefault(): void {
    this.equityAccountTracker.reset();
    this.equityAccountManuallyChanged.set(false);
  }

  private loadExisting(id: number) {
    this.accountingService.getOpeningBalancesInventory().subscribe({
      next: (balances) => {
        const item = balances.find(b => b.id === id);
        if (item) {
          this.isEditing = true;
          this.editingId = id;
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
            entryDate: item.entryDate ? new Date(item.entryDate) : new Date(),
            inventoryAccountId: item.inventoryAccountId ?? null,
            openingBalanceEquityAccountId: item.openingBalanceEquityAccountId ?? null
          });
          // A loaded document's stored override (if any) must display as-is, never be silently
          // recomputed/overwritten by the tracker's own recalculate() -- see
          // sales-invoice-form.component.ts for the same edge case.
          if (item.inventoryAccountId != null) {
            this.inventoryAccountTracker.markAsManuallyChanged();
            this.inventoryAccountManuallyChanged.set(true);
          }
          if (item.openingBalanceEquityAccountId != null) {
            this.equityAccountTracker.markAsManuallyChanged();
            this.equityAccountManuallyChanged.set(true);
          }
          if (item.storeId) {
            this.warnIfCurrentStoreNotConfigured(item.storeId);
            this.recalculateAccountDefaults();
          }
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

  /** Called once the storeId is known (current Showroom for a new item, saved value for an edit)
   *  -- there's no more Store dropdown to hang a (selectionChange) handler off of. */
  private warnIfCurrentStoreNotConfigured(storeId: number): void {
    const storeName = resolveStoreDisplayName(this.storeContext.memberships(), storeId, this.storeContext.current()?.nameAr);
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, storeName).subscribe();
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
        inventoryAccountId: formValue.inventoryAccountId ?? null,
        openingBalanceEquityAccountId: formValue.openingBalanceEquityAccountId ?? null,
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