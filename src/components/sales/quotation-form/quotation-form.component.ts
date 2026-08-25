import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SalesCycleService } from '../../../services/sales-cycle.service';
import { Quotation } from '../../../models/quotation.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentToolbarComponent, DocumentAction } from '../../shared/document';

@Component({
  selector: 'app-quotation-form',
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
    TranslateModule,
    DocumentToolbarComponent
  ],
  templateUrl: './quotation-form.component.html',
  styleUrls: ['./quotation-form.component.css']
})
export class QuotationFormComponent implements OnInit {
  quotationForm: FormGroup;
  isEditMode = false;
  quotationId: number | null = null;
  existingDocNumber: string | null = null;

  constructor(
    private fb: FormBuilder,
    private salesCycleService: SalesCycleService,
    private router: Router
  ) {
    this.quotationForm = this.fb.group({
      quotationDate: [new Date().toISOString().split('T')[0], Validators.required],
      customerId: ['', Validators.required],
      carId: ['', Validators.required],
      quotedPrice: ['', [Validators.required, Validators.min(0)]],
      terms: [''],
      status: ['Pending', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Check if editing
    const id = this.router.url.split('/').pop();
    if (id && !isNaN(+id)) {
      this.isEditMode = true;
      this.quotationId = +id;
      this.loadQuotation(this.quotationId);
    }
  }

  loadQuotation(id: number): void {
    this.salesCycleService.getQuotation(id).subscribe(
      data => {
        this.existingDocNumber = data.quotationNumber;
        this.quotationForm.patchValue(data);
      },
      error => console.error('Error loading quotation', error)
    );
  }

  onSubmit(): void {
    if (this.quotationForm.valid) {
      const formValue = { ...this.quotationForm.value, quotationNumber: this.existingDocNumber || '' };
      if (this.isEditMode && this.quotationId) {
        this.salesCycleService.updateQuotation(this.quotationId, formValue).subscribe(
          () => this.router.navigate(['/sales/quotations']),
          error => console.error('Error updating quotation', error)
        );
      } else {
        this.salesCycleService.createQuotation(formValue).subscribe(
          () => this.router.navigate(['/sales/quotations']),
          error => console.error('Error creating quotation', error)
        );
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/sales/quotations']);
  }

  /** Unified toolbar configuration -- same shared action system as the invoice screens. */
  toolbarActions(): DocumentAction[] {
    return [
      {
        id: 'save',
        label: this.isEditMode ? 'COMMON.UPDATE' : 'COMMON.CREATE',
        icon: 'save',
        variant: 'primary',
        disabled: !this.quotationForm?.valid,
        execute: () => this.onSubmit()
      },
      {
        id: 'cancel',
        label: 'COMMON.CANCEL',
        icon: 'close',
        variant: 'basic',
        execute: () => this.onCancel()
      }
    ];
  }
}