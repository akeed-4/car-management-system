import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConsignmentService } from '../../../services/consignment.service';
import { AttachmentService } from '../../../services/attachment.service';
import { Attachment } from '../../../models/attachment.model';
import { Supplier } from '../../../models/supplier.model';
import { SupplierLookupModalComponent } from '../../shared/supplier-lookup-modal/supplier-lookup-modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
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

  carForm!: FormGroup;
  editMode = signal(false);
  currentId = signal<number | null>(null);
  saving = signal(false);

  selectedSupplier = signal<Supplier | null>(null);

  attachments = signal<Attachment[]>([]);
  uploading = signal(false);

  statusOptions = ['Available', 'Reserved', 'Sold', 'Returned'];

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
      commissionRate: new FormControl<number | null>(5, Validators.required),
      status: new FormControl('Available'),
      location: new FormControl(''),
      notes: new FormControl(''),
    });
  }

  openSupplierLookup(): void {
    const ref = this.dialog.open(SupplierLookupModalComponent, { width: '900px' });
    ref.afterClosed().subscribe((supplier: Supplier | null) => {
      if (supplier) {
        this.selectedSupplier.set(supplier);
        this.carForm.patchValue({ supplierId: supplier.id });
      }
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
    });
  }
}
