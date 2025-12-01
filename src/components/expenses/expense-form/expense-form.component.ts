import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseService } from '../../../services/expense.service';
import { Expense } from '../../../types/expense.model';
import { TreasuryService } from '../../../services/treasury.service';
import { InventoryService } from '../../../services/inventory.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private expenseService = inject(ExpenseService);
  private treasuryService = inject(TreasuryService);
  private inventoryService = inject(InventoryService);

  expense = signal<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0]
  });
  editMode = signal(false);
  pageTitle = signal('إضافة مصروف جديد');

  accounts = this.treasuryService.accounts$;
  cars = this.inventoryService.cars$;

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل المصروف');
        const existing = this.expenseService.getExpenseById(id);
        if (existing) {
          this.expense.set({ ...existing });
        } else {
          this.router.navigate(['/expenses']);
        }
      }
    });
  }

  updateField<K extends keyof Expense>(field: K, value: Expense[K]) {
    this.expense.update(e => ({ ...e, [field]: value }));
  }

  saveExpense() {
    const data = this.expense();
    
    // Add account name
    const account = this.accounts().find(a => a.id === data.accountId);
    if(account) {
      data.accountName = account.name;
    }
    
    // Add car description if car is linked
    if (data.carId) {
        const car = this.cars().find(c => c.id === data.carId);
        if (car) {
            data.carDescription = `${car.make} ${car.model} (${car.year})`;
        }
    } else {
        // Ensure car fields are nullified if no car is selected
        data.carId = undefined;
        data.carDescription = undefined;
    }

    if (this.editMode()) {
      this.expenseService.updateExpense(data as Expense);
    } else {
      const { id, ...newExpense } = data;
      this.expenseService.addExpense(newExpense as Omit<Expense, 'id'>);
    }
    this.router.navigate(['/expenses']);
  }
}