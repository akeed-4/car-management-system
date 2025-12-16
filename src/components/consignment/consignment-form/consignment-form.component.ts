
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConsignmentService } from '../../../services/consignment.service';
import { ConsignmentCar } from '../../../types/consignment-car.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { matTooltipAnimations, MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-consignment-form',
  standalone: true,
  imports: [
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
    MatTooltipModule
  ],
  templateUrl: './consignment-form.component.html',
  styleUrl: './consignment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsignmentFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consignmentService = inject(ConsignmentService);

  consignmentForm!: FormGroup;
  editMode = signal(false);
  pageTitle = signal('إضافة سيارة للعهدة');
  uploadedImages: string[] = [];

  // Sale options costs (can be configured)
  insuranceCost = 1500; // SAR
  inspectionCost = 500; // SAR
  deliveryCost = 300; // SAR
  followUpCost = 200; // SAR

  ngOnInit() {
    this.initForm();
    
    // Handle route params for editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات سيارة العهدة');
      this.consignmentService.getById(id).subscribe(existingCar => {
        this.consignmentForm.patchValue(existingCar);
        // Load existing images
        if (existingCar.documentImages) {
          this.uploadedImages = [...existingCar.documentImages];
        }
      }, error => {
        console.error('Error loading consignment car:', error);
        this.router.navigate(['/consignment-cars']);
      });
    }
  }

  private calculateTotalPrice() {
    const saleOptions = this.consignmentForm.get('saleOptions')?.value;
    const basePrice = this.consignmentForm.get('agreedSalePrice')?.value || 0;

    let totalPrice = basePrice;

    if (saleOptions?.withInsurance) {
      totalPrice += this.insuranceCost;
    }
    if (saleOptions?.withInspection) {
      totalPrice += this.inspectionCost;
    }
    if (saleOptions?.withDelivery) {
      totalPrice += this.deliveryCost;
    }
    if (saleOptions?.withFollowUp) {
      totalPrice += this.followUpCost;
    }

    this.consignmentForm.patchValue({
      totalSalePrice: totalPrice
    }, { emitEvent: false });
  }

  private initForm() {
    this.consignmentForm = new FormGroup({
      // Basic Info
      isForSale: new FormControl(false),

      // Owner Details
      ownerName: new FormControl('', Validators.required),
      ownerIdNumber: new FormControl(''),
      ownerPhone: new FormControl('', Validators.required),

      // Authorized Seller Details
      authorizedSellerName: new FormControl(''),
      authorizedSellerIdNumber: new FormControl(''),

      // Authorization Documents
      authorizationDocumentNumber: new FormControl(''),
      authorizationDocumentDate: new FormControl(''),
      authorizationDocumentAttachment: new FormControl(''),

      // Car Details
      make: new FormControl('', Validators.required),
      model: new FormControl('', Validators.required),
      year: new FormControl(null, Validators.required),
      carType: new FormControl(''),
      transmissionType: new FormControl(''),
      chassisNumber: new FormControl(''),
      exteriorColor: new FormControl(''),
      mileage: new FormControl(null),
      plateNumber: new FormControl(''),
      vin: new FormControl(''),

      // Document Images
      documentImages: new FormControl([]),

      // Financial Details
      agreedSalePrice: new FormControl(null, Validators.required),
      commissionRate: new FormControl(0.05, Validators.required),
      exhibitionFee: new FormControl(0),
      dateReceived: new FormControl(new Date().toISOString().split('T')[0], Validators.required),

      // Buyer Details (for sales)
      buyerName: new FormControl(''),
      buyerIdNumber: new FormControl(''),
      buyerPhone: new FormControl(''),

      // Sale Options
      saleOptions: new FormGroup({
        net: new FormControl(true),
        withInsurance: new FormControl(false),
        withInspection: new FormControl(false),
        withDelivery: new FormControl(false),
        withFollowUp: new FormControl(false)
      }),

      // Calculated costs
      insuranceCost: new FormControl(this.insuranceCost),
      inspectionCost: new FormControl(this.inspectionCost),
      deliveryCost: new FormControl(this.deliveryCost),
      followUpCost: new FormControl(this.followUpCost),
      totalSalePrice: new FormControl(0),

      // Payment Details
      carPricePaid: new FormControl(false),
      exhibitionFeePaid: new FormControl(false),
      paymentDate: new FormControl(''),
      paymentMethod: new FormControl(''),
      paymentReference: new FormControl(''),

      notes: new FormControl('')
    });

    // Watch for changes in sale options to recalculate total price
    this.consignmentForm.get('saleOptions')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });

    // Watch for changes in base sale price
    this.consignmentForm.get('agreedSalePrice')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  saveConsignmentCar() {
    if (this.consignmentForm.invalid) {
      return;
    }

    const formValue = this.consignmentForm.value;
    const carToSave = {
      ...formValue,
      documentImages: this.uploadedImages,
      status: 'Available' as const
    };

    if (this.editMode()) {
      this.consignmentService.updateConsignmentCar(carToSave as ConsignmentCar);
    } else {
      const { id, ...newCar } = carToSave;
      this.consignmentService.addConsignmentCar(newCar as Omit<ConsignmentCar, 'id'>);
    }
    alert('تم حفظ بيانات سيارة العهدة بنجاح.');
    this.router.navigate(['/consignment-cars']);
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              this.uploadedImages.push(e.target.result as string);
              // Update form control
              this.consignmentForm.patchValue({
                documentImages: [...this.uploadedImages]
              });
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  removeImage(index: number) {
    this.uploadedImages.splice(index, 1);
    this.consignmentForm.patchValue({
      documentImages: [...this.uploadedImages]
    });
  }
}
