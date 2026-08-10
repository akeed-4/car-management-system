import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConsignmentService } from '../../../services/consignment.service';
import { AttachmentService } from '../../../services/attachment.service';
import { Attachment } from '../../../models/attachment.model';
import { Supplier } from '../../../models/supplier.model';
import { Car } from '../../../models/car.model';
import { SupplierLookupModalComponent } from '../../shared/supplier-lookup-modal/supplier-lookup-modal.component';
import { VehicleLookupDialogComponent } from '../../shared/vehicle-lookup-dialog/vehicle-lookup-dialog.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { NotificationService } from '../../../services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-consignment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule,
    MatTooltipModule,
  ],
  templateUrl: './consignment-form.component.html',
  styleUrl: './consignment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsignmentFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consignmentService = inject(ConsignmentService);
  private attachmentService = inject(AttachmentService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  carForm!: FormGroup;
  editMode = signal(false);
  currentId = signal<number | null>(null);
  saving = signal(false);

  selectedSupplier = signal<Supplier | null>(null);
  /** True once a vehicle has been pulled in from the lookup popup this session -- purely a UI hint,
   * not persisted; the form fields it populated remain freely editable afterward. */
  selectedVehicleSource = signal<Car | null>(null);

  attachments = signal<Attachment[]>([]);
  uploading = signal(false);

  statusOptions = ['Available', 'Reserved', 'Sold', 'Returned'];
  /** "Sold" is intentionally excluded -- the backend rejects setting it through this generic
   * update path; selling now goes exclusively through the Consignment Sale dialog on the list
   * screen so commission accounting is always posted alongside the status change. */
  editableStatusOptions = ['Available', 'Reserved', 'Returned'];

  ngOnInit() {
    this.initForm();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.currentId.set(id);
      this.editMode.set(true);
      this.consignmentService.getById(id).subscribe({
        next: (response) => {
          const car = response.data;
          this.carForm.patchValue(car);
          this.selectedSupplier.set({
            id: car.supplierId,
            name: car.supplierName,
            phone: car.supplierPhone,
          } as Supplier);
          // Sold vehicles can only change status via the Consignment Sale dialog's
          // cancel/return actions on the list screen -- lock the field here rather than
          // silently dropping "Sold" from the dropdown while still submitting it unchanged.
          if (car.status === 'Sold') {
            this.carForm.get('status')?.disable();
          }
        },
        error: () => {
          this.router.navigate(['/consignment-cars']);
        },
      });
      this.loadAttachments(id);
    }
  }

  private initForm() {
    this.carForm = new FormGroup({
      supplierId: new FormControl<number | null>(null, Validators.required),
      make: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      year: new FormControl<number | null>(null),
      exteriorColor: new FormControl(''),
      vin: new FormControl('', Validators.required),
      engineNumber: new FormControl(''),
      plateNumber: new FormControl(''),
      mileage: new FormControl<number | null>(null),
      arrivalDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      expectedSalePrice: new FormControl<number | null>(null, Validators.required),
      currentCost: new FormControl<number | null>(0, Validators.required),
      commissionType: new FormControl<'Percentage' | 'FixedAmount'>('Percentage'),
      commissionRate: new FormControl<number | null>(5, Validators.required),
      commissionFixedAmount: new FormControl<number | null>(0),
      status: new FormControl('Available'),
      location: new FormControl(''),
      notes: new FormControl(''),
    });
  }

  openSupplierLookup(): void {
    const ref = this.dialog.open(SupplierLookupModalComponent, { width: '900px', panelClass: 'responsive-dialog-panel' });
    ref.afterClosed().subscribe((supplier: Supplier | null) => {
      if (supplier) {
        this.selectedSupplier.set(supplier);
        this.carForm.patchValue({ supplierId: supplier.id });
      }
    });
  }

  /** Opens the shared vehicle lookup popup and fills every ConsignmentCar field that has a real
   * counterpart on the looked-up Car -- ConsignmentCar is a standalone entity (no CarId FK, see
   * consignment-car-form design notes) that only duplicates a subset of Car's fields, so only
   * those overlapping fields are populated here; nothing is silently invented on the form. */
  openVehicleLookup(): void {
    const ref = this.dialog.open(VehicleLookupDialogComponent, { width: '1200px', maxWidth: '95vw', panelClass: 'responsive-dialog-panel' });
    ref.afterClosed().subscribe((car: Car | null) => {
      if (!car) return;

      this.carForm.patchValue({
        make: car.make ?? '',
        model: car.model ?? '',
        year: car.year ?? null,
        exteriorColor: car.exteriorColor ?? '',
        vin: car.vin ?? '',
        plateNumber: car.plateNumber ?? '',
        mileage: car.mileage ?? null,
      });

      // Mark every field the lookup just touched as dirty/touched so validation styling and any
      // (valueChanges) subscribers downstream react exactly as if the user had typed them in.
      ['make', 'model', 'year', 'exteriorColor', 'vin', 'plateNumber', 'mileage'].forEach((name) => {
        const control = this.carForm.get(name);
        control?.markAsDirty();
        control?.markAsTouched();
      });

      this.selectedVehicleSource.set(car);
      this.notificationService.showSuccess(
        this.translate.instant('CONSIGNMENT.FORM.VEHICLE_PREFILLED_FROM_LOOKUP')
      );
    });
  }

  saveCar() {
    if (this.carForm.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);

    const formValue = this.carForm.value;

    if (this.editMode() && this.currentId()) {
      this.consignmentService.update(this.currentId()!, formValue).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/consignment-cars']);
        },
        error: () => this.saving.set(false),
      });
    } else {
      const createDto = { ...formValue, createdBy: 1 };
      this.consignmentService.create(createDto).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/consignment-cars']);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  private loadAttachments(id: number): void {
    this.attachmentService.getForDocument('ConsignmentCar', id).subscribe({
      next: (list) => this.attachments.set(list),
      error: () => this.attachments.set([]),
    });
  }

  onFileSelected(event: Event): void {
    const id = this.currentId();
    if (!id) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.attachmentService.upload(file, 'ConsignmentCar', id, 1).subscribe({
      next: () => {
        this.uploading.set(false);
        this.loadAttachments(id);
      },
      error: () => this.uploading.set(false),
    });
    input.value = '';
  }

  deleteAttachment(attachmentId: number): void {
    const id = this.currentId();
    if (!id) return;
    this.attachmentService.delete(attachmentId).subscribe(() => {
      this.loadAttachments(id);
    });
  }

  fileUrl(attachment: Attachment): string {
    return this.attachmentService.fileUrl(attachment);
  }

  openHistory(): void {
    const id = this.currentId();
    if (!id) return;
    this.dialog.open(AuditHistoryPanelComponent, {
      data: { entityName: 'ConsignmentCar', entityId: id },
      width: '600px',
      panelClass: 'responsive-dialog-panel',
    });
  }
}
