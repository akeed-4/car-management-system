import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { PurchaseOffer } from '../../../models/purchase-offer.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-purchase-offer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './purchase-offer-form.component.html',
  styleUrls: ['./purchase-offer-form.component.css']
})
export class PurchaseOfferFormComponent implements OnInit {
  purchaseOfferForm: FormGroup;
  isEditMode = false;
  purchaseOfferId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private router: Router
  ) {
    this.purchaseOfferForm = this.fb.group({
      offerNumber: ['', Validators.required],
      offerDate: [new Date().toISOString().split('T')[0], Validators.required],
      supplierId: ['', Validators.required],
      carDescription: ['', Validators.required],
      make: ['', Validators.required],
      model: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      offeredPrice: ['', [Validators.required, Validators.min(0)]],
      status: ['Pending', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Check if editing
    const id = this.router.url.split('/').pop();
    if (id && !isNaN(+id)) {
      this.isEditMode = true;
      this.purchaseOfferId = +id;
      this.loadPurchaseOffer(this.purchaseOfferId);
    }
  }

  loadPurchaseOffer(id: number): void {
    this.purchaseCycleService.getPurchaseOffer(id).subscribe(
      data => {
        this.purchaseOfferForm.patchValue(data);
      },
      error => console.error('Error loading purchase offer', error)
    );
  }

  onSubmit(): void {
    if (this.purchaseOfferForm.valid) {
      const formValue = this.purchaseOfferForm.value;
      if (this.isEditMode && this.purchaseOfferId) {
        this.purchaseCycleService.updatePurchaseOffer(this.purchaseOfferId, formValue).subscribe(
          () => this.router.navigate(['/purchase-offers']),
          error => console.error('Error updating purchase offer', error)
        );
      } else {
        this.purchaseCycleService.createPurchaseOffer(formValue).subscribe(
          () => this.router.navigate(['/purchase-offers']),
          error => console.error('Error creating purchase offer', error)
        );
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/purchase-offers']);
  }
}