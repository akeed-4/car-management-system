import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ExpenseService } from '../../../services/expense.service';
import { Expense } from '../../../types/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.css'
})
export class ExpenseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  expenseForm!: FormGroup;
  isEditMode = false;
  expenseId?: number;

  categories = [
    { value: 'Rent', label: 'إيجار' },
    { value: 'Utilities', label: 'مرافق' },
    { value: 'Salaries', label: 'رواتب' },
    { value: 'Marketing', label: 'تسويق' },
    { value: 'Maintenance', label: 'صيانة' },
    { value: 'Other', label: 'أخرى' }
  ];

  ngOnInit() {
    this.initializeForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.expenseId = +id;
      this.loadExpense(this.expenseId);
    }
  }

  initializeForm() {
    this.expenseForm = this.fb.group({
      date: [this.getCurrentDate(), Validators.required],
      description: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });
  }

  loadExpense(id: number) {
    const expense = this.expenseService.getExpenseById(id);
    if (expense) {
      this.expenseForm.patchValue(expense);
    } else {
      this.router.navigate(['/expenses']);
    }
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const formValue = this.expenseForm.value;
      
      if (this.isEditMode && this.expenseId) {
        const updatedExpense: Expense = {
          id: this.expenseId,
          ...formValue
        };
        this.expenseService.updateExpense(updatedExpense);
      } else {
        this.expenseService.addExpense(formValue);
      }
      
      this.router.navigate(['/expenses']);
    } else {
      this.markFormGroupTouched(this.expenseForm);
    }
  }

  onCancel() {
    this.router.navigate(['/expenses']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.expenseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.expenseForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) return 'هذا الحقل مطلوب';
      if (control.errors['minlength']) return 'النص قصير جداً';
      if (control.errors['min']) return 'القيمة يجب أن تكون أكبر من صفر';
    }
    return '';
  }
}
