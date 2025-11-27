import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ReceiptService } from '../../../services/receipt.service';
import { Receipt } from '../../../types/receipt.model';

@Component({
  selector: 'app-receipt-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './receipt-form.component.html',
  styleUrl: './receipt-form.component.css'
})
export class ReceiptFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private receiptService = inject(ReceiptService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  receiptForm!: FormGroup;
  isEditMode = false;
  receiptId?: number;

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
      this.receiptId = +id;
      this.loadReceipt(this.receiptId);
    } else {
      // Set auto-generated receipt number for new receipts
      this.receiptForm.patchValue({
        receiptNumber: this.receiptService.generateReceiptNumber()
      });
    }
  }

  initializeForm() {
    this.receiptForm = this.fb.group({
      date: [this.getCurrentDate(), Validators.required],
      receiptNumber: ['', Validators.required],
      customerName: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(3)]],
      notes: ['']
    });
  }

  loadReceipt(id: number) {
    const receipt = this.receiptService.getReceiptById(id);
    if (receipt) {
      this.receiptForm.patchValue(receipt);
    } else {
      this.router.navigate(['/accounts/receipts']);
    }
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.receiptForm.valid) {
      const formValue = this.receiptForm.value;
      
      if (this.isEditMode && this.receiptId) {
        const updatedReceipt: Receipt = {
          id: this.receiptId,
          ...formValue
        };
        this.receiptService.updateReceipt(updatedReceipt);
      } else {
        this.receiptService.addReceipt(formValue);
      }
      
      this.router.navigate(['/accounts/receipts']);
    } else {
      this.markFormGroupTouched(this.receiptForm);
    }
  }

  onCancel() {
    this.router.navigate(['/accounts/receipts']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.receiptForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.receiptForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) return 'هذا الحقل مطلوب';
      if (control.errors['minlength']) return 'النص قصير جداً';
      if (control.errors['min']) return 'القيمة يجب أن تكون أكبر من صفر';
    }
    return '';
  }
}
