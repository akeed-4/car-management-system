import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CurrencyPipe } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { CustomerService } from '../../../../services/customer.service';
import { InventoryService } from '../../../../services/inventory.service';
import { StoreService } from '../../../../services/store.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { StoreAccountingConfigurationService } from '../../../../services/store-accounting-configuration.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateQuotationLine } from '../../../../models/corporate/corporate-quotation.model';
import { CarSelectionDialogComponent } from '../../car-selection-dialog/car-selection-dialog.component';
import { warnIfStoreNotConfigured } from '../../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { BranchContextService } from '../../../../services/branch-context.service';
import { scopeStoresToCurrentBranch } from '../../../../models/branch-scoped-stores.util';

const VAT_RATE = 0.15;

@Component({
  selector: 'app-corporate-quotation-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatGridListModule,
    MatDialogModule,
    DxDataGridModule,
    TranslateModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './corporate-quotation-container.component.html',
  styleUrls: ['./corporate-quotation-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateQuotationContainerComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private customerService = inject(CustomerService);
  private inventoryService = inject(InventoryService);
  private storeService = inject(StoreService);
  private currentSettingService = inject(CurrentSettingService);
  private storeAccountingConfigService = inject(StoreAccountingConfigurationService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private branchContext = inject(BranchContextService);
  private injector = inject(Injector);

  customers = this.customerService.customers$;
  cars = this.inventoryService.cars$;
  /** Store dropdown options scoped to the caller's current branch -- this form is create-only
   *  (no edit mode), so there is no already-saved store to preserve. */
  stores = computed(() => scopeStoresToCurrentBranch(this.storeService.stores$(), this.branchContext.current()?.branchId, null));

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  submitting = signal(false);
  lines = signal<CorporateQuotationLine[]>([]);

  quotationForm!: FormGroup;

  ngOnInit(): void {
    this.quotationForm = new FormGroup({
      customerId: new FormControl(null, Validators.required),
      storeId: new FormControl(null, Validators.required),
      quotationDate: new FormControl(new Date(), Validators.required),
      expiryDate: new FormControl(null),
      contactPerson: new FormControl(''),
      paymentTerms: new FormControl(''),
      volumeDiscountPercent: new FormControl(0, [Validators.min(0), Validators.max(100)]),
      notes: new FormControl('')
    });

    this.quotationForm.get('volumeDiscountPercent')?.valueChanges.subscribe(() => this.recalculateDiscounts());

    // Auto-select the store once the branch-scoped list resolves to exactly one option, so a
    // user whose branch has a single store never has to manually pick it.
    effect(() => {
      const options = this.stores();
      const storeIdControl = this.quotationForm.get('storeId');
      if (options.length === 1 && !storeIdControl?.value && !storeIdControl?.dirty) {
        storeIdControl?.setValue(options[0].id);
        this.onStoreSelectionChange(options[0].id);
      }
    }, { injector: this.injector });
  }

  onStoreSelectionChange(storeId: number | null): void {
    const store = this.stores().find(s => s.id === storeId);
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, store?.nameAr ?? '').subscribe();
  }

  private recalculateDiscounts(): void {
    const discountPercent = this.quotationForm.get('volumeDiscountPercent')?.value || 0;
    this.lines.update(lines =>
      lines.map(line => ({
        ...line,
        discountedPrice: line.unitPrice * (1 - discountPercent / 100)
      }))
    );
  }

  openVehicleDialog(): void {
    const storeId = this.quotationForm.get('storeId')?.value;
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: { storeId },
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(selectedCar => {
      if (!selectedCar) {
        return;
      }
      this.addVehicleLine(selectedCar.carId, selectedCar.carDescription || selectedCar.carName);
    });
  }

  private addVehicleLine(carId: number, carDescription: string): void {
    // Selecting the same vehicle again adds another unit to its existing line instead of
    // rejecting, so a single quotation can request multiple units of one vehicle.
    const existing = this.lines().find(l => l.carId === carId);
    if (existing) {
      this.updateLineQuantity(carId, existing.quantity + 1);
      return;
    }

    const car = this.cars().find((c: any) => c.id === carId);
    const unitPrice = car?.salePrice || 0;
    const discountPercent = this.quotationForm.get('volumeDiscountPercent')?.value || 0;

    this.lines.update(lines => [
      ...lines,
      {
        carId,
        vin: car?.vin || car?.chassisNumber,
        carDescription: carDescription || (car ? `${car.make} ${car.model} ${car.year}` : ''),
        unitPrice,
        discountedPrice: unitPrice * (1 - discountPercent / 100),
        quantity: 1
      }
    ]);
  }

  updateLineQuantity(carId: number, quantity: number): void {
    this.lines.update(lines =>
      lines.map(l => (l.carId === carId ? { ...l, quantity: quantity > 0 ? quantity : 1 } : l))
    );
  }

  onQuantityChanged(e: any): void {
    if (e?.data?.carId != null) {
      this.updateLineQuantity(e.data.carId, e.data.quantity);
    }
  }

  removeLine(carId: number): void {
    this.lines.update(lines => lines.filter(l => l.carId !== carId));
  }

  // ---- Totals ----
  subtotal = computed(() => this.lines().reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  totalDiscount = computed(() => this.subtotal() - this.netTotal());
  netTotal = computed(() => this.lines().reduce((sum, l) => sum + l.discountedPrice * l.quantity, 0));
  vatAmount = computed(() => this.netTotal() * VAT_RATE);
  grandTotal = computed(() => this.netTotal() + this.vatAmount());

  get isFormValid(): boolean {
    return this.quotationForm.valid && this.lines().length > 0;
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      if (this.lines().length === 0) {
        this.notificationService.showError('CORPORATE.ADD_AT_LEAST_ONE_VEHICLE');
      }
      return;
    }

    const raw = this.quotationForm.getRawValue();
    this.submitting.set(true);

    this.corporateFleetService
      .createQuotation({
        customerId: raw.customerId,
        expiryDate: raw.expiryDate ? new Date(raw.expiryDate).toISOString() : undefined,
        contactPerson: raw.contactPerson || undefined,
        paymentTerms: raw.paymentTerms || undefined,
        volumeDiscountPercent: raw.volumeDiscountPercent || 0,
        lines: this.lines().map(l => ({ carId: l.carId, unitPrice: l.unitPrice, quantity: l.quantity })),
        notes: raw.notes || undefined,
        userId: 1
      })
      .subscribe({
        next: quotation => {
          this.submitting.set(false);
          this.notificationService.showSuccess('CORPORATE.QUOTATION_CREATED');
          this.router.navigate(['/sales/corporate/orders/new'], {
            queryParams: { quotationId: quotation.id }
          });
        },
        error: (err) => {
          this.submitting.set(false);
          this.notificationService.showError(err?.error?.message || 'CORPORATE.QUOTATION_CREATE_FAILED');
        }
      });
  }
}
