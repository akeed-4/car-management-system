import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { DxDataGridModule, DxButtonModule, DxSelectBoxModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { PurchaseOffer } from '../../../models/purchase-offer.model';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { Supplier } from '../../../models/purchase-offer.model';

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
    MatIconModule,
    DxDataGridModule,
    DxButtonModule,
    DxSelectBoxModule,
    TranslateModule
  ],
  templateUrl: './purchase-offer-form.component.html',
  styleUrls: ['./purchase-offer-form.component.css']
})
export class PurchaseOfferFormComponent implements OnInit {
  offerForm!: FormGroup;
  isEditMode = false;
  offerId?: number;
  suppliers: Supplier[] = [];

  constructor(
    private fb: FormBuilder,
    private purchaseCycleService: PurchaseCycleService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.offerId = +params['id'];
        this.loadOffer(this.offerId);
      }
    });
  }

  initForm(): void {
    this.offerForm = this.fb.group({
      offerNumber: ['', Validators.required],
      supplierId: [null, Validators.required],
      offerDate: [new Date(), Validators.required],
      carDescription: ['', Validators.required],
      make: ['', Validators.required],
      model: ['', Validators.required],
      year: [new Date().getFullYear(), Validators.required],
      offeredPrice: [0, [Validators.required, Validators.min(0)]],
      status: ['Pending', Validators.required],
      notes: ['']
    });
  }

  loadOffer(id: number): void {
    this.purchaseCycleService.getPurchaseOffer(id).subscribe(offer => {
      this.offerForm.patchValue(offer);
    });
  }

  onSubmit(): void {
    if (this.offerForm.valid) {
      const offerData = this.offerForm.value;
      const operation = this.isEditMode 
        ? this.purchaseCycleService.updatePurchaseOffer(this.offerId!, offerData)
        : this.purchaseCycleService.createPurchaseOffer(offerData);

      operation.subscribe(() => {
        this.router.navigate(['/purchases/offers']);
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/purchases/offers']);
  }

}
