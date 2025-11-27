import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../../../services/payment.service';
import { Payment } from '../../../../types/payment.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css'
})
export class PaymentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  paymentForm!: FormGroup;
  isEditMode = false;
  paymentId?: number;

  paymentMethods = [
    { value: 'Cash', label: 'نقدي' },
    { value: 'Check', label: 'شيك' },
    { value: 'BankTransfer', label: 'تحويل بنكي' },
    { value: 'CreditCard', label: 'بطاقة ائتمان' }
  ];

  ngOnInit() {
    this.initializeForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.paymentId = +id;
      this.loadPayment(this.paymentId);
    } else {
      // Set auto-generated payment number for new payments
      this.paymentForm.patchValue({
        paymentNumber: this.paymentService.generatePaymentNumber()
      });
    }
  }

  initializeForm() {
    this.paymentForm = this.fb.group({
      date: [this.getCurrentDate(), Validators.required],
      paymentNumber: ['', Validators.required],
      supplierName: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(3)]],
      notes: ['']
    });
  }

  loadPayment(id: number) {
    const payment = this.paymentService.getPaymentById(id);
    if (payment) {
      this.paymentForm.patchValue(payment);
    } else {
      this.router.navigate(['/accounts/payments']);
    }
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.value;
      
      if (this.isEditMode && this.paymentId) {
        const updatedPayment: Payment = {
          id: this.paymentId,
          ...formValue
        };
        this.paymentService.updatePayment(updatedPayment);
      } else {
        this.paymentService.addPayment(formValue);
      }
      
      this.router.navigate(['/accounts/payments']);
    } else {
      this.markFormGroupTouched(this.paymentForm);
    }
  }

  onCancel() {
    this.router.navigate(['/accounts/payments']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.paymentForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) return 'هذا الحقل مطلوب';
      if (control.errors['minlength']) return 'النص قصير جداً';
      if (control.errors['min']) return 'القيمة يجب أن تكون أكبر من صفر';
    }
    return '';
  }
}
