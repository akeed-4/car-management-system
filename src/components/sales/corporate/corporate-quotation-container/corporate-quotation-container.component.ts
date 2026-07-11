import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CurrencyPipe } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { CustomerService } from '../../../../services/customer.service';
import { InventoryService } from '../../../../services/inventory.service';
import { StoreService } from '../../../../services/store.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateQuotationLine } from '../../../../models/corporate/corporate-quotation.model';
import { CarSelectionDialogComponent } from '../../car-selection-dialog/car-selection-dialog.component';

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
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  customers = this.customerService.customers$;
  cars = this.inventoryService.cars$;
  stores = this.storeService.stores$;

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
      data: { storeId }
    });

    dialogRef.afterClosed().subscribe(selectedCar => {
      if (!selectedCar) {
        return;
      }
      this.addVehicleLine(selectedCar.carId, selectedCar.carDescription || selectedCar.carName);
    });
  }

  private addVehicleLine(carId: number, carDescription: string): void {
    if (this.lines().some(l => l.carId === carId)) {
      this.notificationService.showError('CORPORATE.VEHICLE_ALREADY_ADDED');
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
        discountedPrice: unitPrice * (1 - discountPercent / 100)
      }
    ]);
  }

  removeLine(carId: number): void {
    this.lines.update(lines => lines.filter(l => l.carId !== carId));
  }

  // ---- Totals ----
  subtotal = computed(() => this.lines().reduce((sum, l) => sum + l.unitPrice, 0));
  totalDiscount = computed(() => this.subtotal() - this.netTotal());
  netTotal = computed(() => this.lines().reduce((sum, l) => sum + l.discountedPrice, 0));
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
        lines: this.lines().map(l => ({ carId: l.carId, unitPrice: l.unitPrice })),
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
        error: () => {
          this.submitting.set(false);
          this.notificationService.showError('CORPORATE.QUOTATION_CREATE_FAILED');
        }
      });
  }
}
