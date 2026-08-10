import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { InventoryService } from '../../../../services/inventory.service';
import { StoreService } from '../../../../services/store.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { CarSelectionDialogComponent } from '../../car-selection-dialog/car-selection-dialog.component';

const VAT_RATE = 0.15;

@Component({
  selector: 'app-bank-quotation-container',
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
  templateUrl: './bank-quotation-container.component.html',
  styleUrls: ['./bank-quotation-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankQuotationContainerComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private inventoryService = inject(InventoryService);
  private storeService = inject(StoreService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  banks = signal<{ id: number; name: string }[]>([]);
  cars = this.inventoryService.cars$;
  stores = this.storeService.stores$;

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  submitting = signal(false);
  selectedVehicle = signal<{ carId: number; carDescription: string; vehiclePrice: number } | null>(null);

  quotationForm!: FormGroup;

  ngOnInit(): void {
    this.quotationForm = new FormGroup({
      endUserName: new FormControl('', Validators.required),
      endUserMobile: new FormControl('', [Validators.required, Validators.pattern(/^[0-9+\s-]{7,15}$/)]),
      endUserNationalId: new FormControl('', Validators.required),
      bankId: new FormControl(null, Validators.required),
      storeId: new FormControl(null, Validators.required),
      quantity: new FormControl(1, [Validators.required, Validators.min(1)]),
      quotationDate: new FormControl(new Date(), Validators.required)
    });

    this.bankFinancingService.getBankPartners().subscribe({
      next: (banks) => this.banks.set(banks || []),
      error: () => this.notificationService.showError('BANK_FINANCING.PARTNERS_LOAD_FAILED')
    });

    this.quotationForm.get('quantity')!.valueChanges.subscribe(v => this.quantity.set(v > 0 ? v : 1));
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
      const car = this.cars().find((c: any) => c.id === selectedCar.carId);
      this.selectedVehicle.set({
        carId: selectedCar.carId,
        carDescription: selectedCar.carDescription || selectedCar.carName,
        vehiclePrice: car?.salePrice || 0
      });
    });
  }

  vehicleLines = computed(() => {
    const vehicle = this.selectedVehicle();
    return vehicle ? [vehicle] : [];
  });

  quantity = signal(1);
  vatAmount = computed(() => (this.selectedVehicle()?.vehiclePrice || 0) * this.quantity() * VAT_RATE);
  grandTotal = computed(() => (this.selectedVehicle()?.vehiclePrice || 0) * this.quantity() + this.vatAmount());

  get isFormValid(): boolean {
    return this.quotationForm.valid && !!this.selectedVehicle();
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      if (!this.selectedVehicle()) {
        this.notificationService.showError('BANK_FINANCING.SELECT_VEHICLE_REQUIRED');
      }
      return;
    }

    const raw = this.quotationForm.getRawValue();
    const branchId = this.stores().find(s => s.id === raw.storeId)?.branchId;
    if (!branchId) {
      this.notificationService.showError('BANK_FINANCING.SELECT_VEHICLE_REQUIRED');
      return;
    }

    this.submitting.set(true);

    this.bankFinancingService
      .createQuotation({
        endUserName: raw.endUserName,
        endUserMobile: raw.endUserMobile,
        endUserNationalId: raw.endUserNationalId,
        bankId: raw.bankId,
        carId: this.selectedVehicle()!.carId,
        quantity: raw.quantity > 0 ? raw.quantity : 1,
        branchId,
        userId: 1
      })
      .subscribe({
        next: quotation => {
          this.submitting.set(false);
          this.notificationService.showSuccess('BANK_FINANCING.QUOTATION_CREATED');
          this.router.navigate(['/sales/bank/approvals/new'], {
            queryParams: { quotationId: quotation.id }
          });
        },
        error: (err) => {
          this.submitting.set(false);
          this.notificationService.showError(err?.error?.message || 'BANK_FINANCING.QUOTATION_CREATE_FAILED');
        }
      });
  }
}
