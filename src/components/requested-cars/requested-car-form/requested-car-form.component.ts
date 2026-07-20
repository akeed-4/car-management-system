import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RequestedCarService } from '../../../services/requested-car.service';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { CarModelService } from '../../../services/car-model.service';
import { ManufactureYearService } from '../../../services/manufacture-year.service';
import { UserService } from '../../../services/user.service';
import { AttachmentService } from '../../../services/attachment.service';
import { Attachment } from '../../../models/attachment.model';
import { Customer } from '../../../models/customer.model';
import { Car } from '../../../models/car.model';
import { CustomerLookupModalComponent } from '../../shared/customer-lookup-modal/customer-lookup-modal.component';
import { VehicleLookupDialogComponent } from '../../shared/vehicle-lookup-dialog/vehicle-lookup-dialog.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { RequestedCarAiPanelComponent } from '../requested-car-ai-panel/requested-car-ai-panel.component';
import { RequestedCar } from '../../../models/requested-car.model';
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
  selector: 'app-requested-car-form',
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
  templateUrl: './requested-car-form.component.html',
  styleUrl: './requested-car-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestedCarFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private requestedCarService = inject(RequestedCarService);
  private manufacturerService = inject(ManufacturerService);
  private carModelService = inject(CarModelService);
  private yearService = inject(ManufactureYearService);
  private userService = inject(UserService);
  private attachmentService = inject(AttachmentService);
  private dialog = inject(MatDialog);

  requestForm!: FormGroup;
  editMode = signal(false);
  currentId = signal<number | null>(null);
  saving = signal(false);

  selectedCustomer = signal<Customer | null>(null);
  /** Set when the current Make/Model/Year/Color came from a selected inventory vehicle rather
   * than free-text entry; drives the locked/read-only state of those fields. */
  selectedVehicle = signal<Car | null>(null);

  manufacturers = this.manufacturerService.manufacturers$;
  allModels = toSignal(this.carModelService.getCarModels(), { initialValue: [] });
  years = this.yearService.years$;
  salespeople = this.userService.activeUsers$;

  attachments = signal<Attachment[]>([]);
  uploading = signal(false);

  statusOptions = ['New', 'Contacted', 'Sourced', 'Closed'];
  priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
  reservationOptions = ['NotReserved', 'Reserved', 'Confirmed'];

  filteredModels = computed(() => {
    const carMake = this.requestForm?.get('make')?.value;
    const selectedManufacturer = this.manufacturers().find(m => m.name === carMake);
    if (!selectedManufacturer) {
      return [];
    }
    return this.allModels().filter(m => m.manufacturerId === selectedManufacturer.id);
  });

  ngOnInit() {
    this.initForm();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.currentId.set(id);
      this.editMode.set(true);
      this.requestedCarService.getById(id).subscribe({
        next: (response) => {
          const rc = response.data;
          this.requestForm.patchValue(rc);
          this.selectedCustomer.set({
            id: rc.customerId,
            name: rc.customerName,
            phone: rc.customerPhone,
          } as Customer);
          if (rc.carId) {
            // Denormalized fields only -- full Car isn't refetched here, just enough to show
            // the locked summary and know a real vehicle (not free text) backs this request.
            this.selectedVehicle.set({
              id: rc.carId,
              vin: rc.carVin ?? '',
              plateNumber: rc.carPlateNumber ?? '',
              make: rc.make,
              model: rc.model,
              year: rc.year,
            } as Car);
            this.lockVehicleFields();
          }
        },
        error: () => {
          this.router.navigate(['/requested-cars']);
        },
      });
      this.loadAttachments(id);
    }
  }

  private initForm() {
    this.requestForm = new FormGroup({
      customerId: new FormControl<number | null>(null, Validators.required),
      salespersonId: new FormControl<number | null>(null),
      carId: new FormControl<number | null>(null),
      make: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      year: new FormControl<number | null>(null),
      color: new FormControl(''),
      preferredSpecifications: new FormControl(''),
      priority: new FormControl('Medium', Validators.required),
      expectedArrival: new FormControl<string | null>(null),
      reservationStatus: new FormControl('NotReserved', Validators.required),
      status: new FormControl('New', Validators.required),
      notes: new FormControl(''),
      requestDate: new FormControl(new Date().toISOString().split('T')[0]),
    });
  }

  openCustomerLookup(): void {
    const ref = this.dialog.open(CustomerLookupModalComponent, { width: '900px' });
    ref.afterClosed().subscribe((customer: Customer | null) => {
      if (customer) {
        this.selectedCustomer.set(customer);
        this.requestForm.patchValue({ customerId: customer.id });
      }
    });
  }

  openVehicleLookup(): void {
    const ref = this.dialog.open(VehicleLookupDialogComponent, { width: '1200px' });
    ref.afterClosed().subscribe((vehicle: Car | null) => {
      if (vehicle) {
        this.selectedVehicle.set(vehicle);
        this.requestForm.patchValue({
          carId: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.exteriorColor,
        });
        this.lockVehicleFields();
      }
    });
  }

  /** Selecting another vehicle while locked (edit mode) refreshes the mapped fields the same
   * way a fresh selection does -- re-running the lookup and patch is enough since patchValue
   * works on disabled controls. */
  private lockVehicleFields(): void {
    this.requestForm.get('make')?.disable({ emitEvent: false });
    this.requestForm.get('model')?.disable({ emitEvent: false });
    this.requestForm.get('year')?.disable({ emitEvent: false });
    this.requestForm.get('color')?.disable({ emitEvent: false });
  }

  /** "Enter manually" fallback: clears the vehicle link and re-enables free-text entry for
   * requests describing a car not currently in stock. */
  clearVehicleSelection(): void {
    this.selectedVehicle.set(null);
    this.requestForm.get('make')?.enable({ emitEvent: false });
    this.requestForm.get('model')?.enable({ emitEvent: false });
    this.requestForm.get('year')?.enable({ emitEvent: false });
    this.requestForm.get('color')?.enable({ emitEvent: false });
    this.requestForm.patchValue({ carId: null, make: '', model: '', year: null, color: '' });
  }

  saveRequest() {
    if (this.requestForm.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);

    // getRawValue(), not .value -- Make/Model/Year/Color are disabled while locked to a
    // selected vehicle, and .value silently omits disabled controls from the payload.
    const formValue = this.requestForm.getRawValue();

    if (this.editMode() && this.currentId()) {
      const updateDto = { ...formValue, clearCarId: !formValue.carId };
      this.requestedCarService.update(this.currentId()!, updateDto).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/requested-cars']);
        },
        error: () => this.saving.set(false),
      });
    } else {
      const createDto = { ...formValue, createdBy: 1 };
      this.requestedCarService.create(createDto).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/requested-cars']);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  private loadAttachments(id: number): void {
    this.attachmentService.getForDocument('RequestedCar', id).subscribe({
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
    this.attachmentService.upload(file, 'RequestedCar', id, 1).subscribe({
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
      data: { entityName: 'RequestedCar', entityId: id },
      width: '600px',
    });
  }

  openAiPanel(): void {
    const id = this.currentId();
    if (!id) return;
    const rc: RequestedCar = {
      ...this.requestForm.value,
      id,
      requestNumber: '',
      customerName: this.selectedCustomer()?.name ?? '',
      customerPhone: this.selectedCustomer()?.phone ?? '',
      createdBy: 0,
      createdAt: '',
    };
    this.dialog.open(RequestedCarAiPanelComponent, {
      data: { requestedCar: rc },
      width: '600px',
    });
  }

  trackByManufacturer(index: number, manufacturer: { id: number }): number {
    return manufacturer.id;
  }

  trackByModel(index: number, model: { id: number }): number {
    return model.id;
  }

  trackByYear(index: number, year: number): number {
    return year;
  }

  trackByUser(index: number, user: { id: number }): number {
    return user.id;
  }
}
