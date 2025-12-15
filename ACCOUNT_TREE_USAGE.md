/**
 * USAGE EXAMPLE FOR ACCOUNT TREE COMPONENT
 * 
 * This file demonstrates how to integrate the AccountTreeComponent
 * into your Angular application routing and usage.
 */

// 1. ROUTING CONFIGURATION (app.routes.ts or similar)
// ================================================

import { Routes } from '@angular/router';
import { AccountTreeComponent } from './components/setup/account-tree/account-tree.component';

export const setupRoutes: Routes = [
  {
    path: 'setup',
    children: [
      {
        path: 'chart-of-accounts',
        component: AccountTreeComponent,
        data: { title: 'Chart of Accounts' }
      },
      // ... other setup routes
    ]
  }
];

// 2. COMPONENT USAGE (Parent Component)
// =====================================

import { Component } from '@angular/core';
import { AccountTreeComponent } from './components/setup/account-tree/account-tree.component';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [AccountTreeComponent],
  template: `
    <app-account-tree></app-account-tree>
  `
})
export class SetupComponent {}

// 3. SERVICE USAGE (If you need to programmatically interact)
// ============================================================

import { Component, OnInit, inject } from '@angular/core';
import { ChartOfAccountsService } from './services/chart-of-accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './types/account-node.model';

@Component({
  selector: 'app-account-operations',
  template: `<!-- Your template -->`
})
export class AccountOperationsComponent implements OnInit {
  private chartService = inject(ChartOfAccountsService);

  ngOnInit() {
    // Get all accounts
    this.chartService.getAccounts().subscribe(accounts => {
      console.log('All accounts:', accounts);
    });

    // Get hierarchical accounts (flattened for TreeList)
    this.chartService.getHierarchicalAccounts().subscribe(accounts => {
      console.log('Hierarchical accounts:', accounts);
    });

    // Get specific account
    this.chartService.getAccountById(1).subscribe(account => {
      console.log('Account details:', account);
    });

    // Create new account
    const newAccount: CreateAccountDto = {
      code: '5400',
      name: 'Other Expenses',
      type: 'PARENT',
      parentId: 50 // Parent: Expenses
    };
    this.chartService.createAccount(newAccount).subscribe(
      created => console.log('Account created:', created),
      error => console.error('Error creating account:', error)
    );

    // Update existing account
    const updateData: UpdateAccountDto = {
      id: 59,
      code: '5310',
      name: 'Advertising and Marketing',
      type: 'ACCOUNT',
      parentId: 58
    };
    this.chartService.updateAccount(updateData).subscribe(
      updated => console.log('Account updated:', updated),
      error => console.error('Error updating account:', error)
    );

    // Delete account
    this.chartService.deleteAccount(60).subscribe(
      () => console.log('Account deleted'),
      error => console.error('Error deleting account:', error)
    );

    // Get accounts by category
    this.chartService.getAccountsByCategory('EXPENSES').subscribe(
      accounts => console.log('Expense accounts:', accounts)
    );
  }
}

// 4. NAVIGATION LINK (in navbar or menu component)
// ================================================

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav>
      <a routerLink="/setup/chart-of-accounts">Chart of Accounts</a>
    </nav>
  `
})
export class NavigationComponent {}

// 5. FEATURES OVERVIEW
// ====================

/**
 * The AccountTreeComponent provides:
 * 
 * ✅ DISPLAY FEATURES:
 *    - Hierarchical tree structure with DevExtreme TreeList
 *    - Expandable/collapsible nodes
 *    - RTL support for Arabic language
 *    - Currency formatted balance display
 *    - 3-level hierarchy: Category > Subcategory > Account
 *
 * ✅ CRUD OPERATIONS:
 *    - Create: Add new accounts with parent account selection
 *    - Read: Display full chart with 60+ sample accounts
 *    - Update: Edit account code, name, type, parent
 *    - Delete: Remove accounts (with validation for child accounts)
 *
 * ✅ DATA STRUCTURE:
 *    Account Types: PARENT (category) | ACCOUNT (leaf)
 *    Sample Categories:
 *      - Assets (1000-1300)
 *      - Liabilities (2000-2200)
 *      - Equity (3000-3200)
 *      - Revenue (4000-4200)
 *      - Expenses (5000-5300)
 *
 * ✅ UI/UX:
 *    - Responsive design (mobile, tablet, desktop)
 *    - Modal dialogs for add/edit/delete operations
 *    - Form validation (required fields, min length)
 *    - Loading states and error handling
 *    - Professional styling with gradients and transitions
 *
 * ✅ ACCESSIBILITY:
 *    - Arabic and English translations
 *    - Semantic HTML structure
 *    - Keyboard navigation support
 *    - Screen reader friendly
 */

// 6. SAMPLE DATA STRUCTURE
// ========================

/**
 * The component initializes with 60+ accounts organized as:
 *
 * ASSETS (1000)
 * ├── Cash & Banks (1100)
 * │   ├── Cash in Drawer (1110) - SAR 50,000
 * │   └── Bank Account - First Bank (1120) - SAR 200,000
 * ├── Receivables (1200)
 * │   ├── Customers (1210) - SAR 100,000
 * │   └── Notes Receivable (1220) - SAR 50,000
 * └── Inventory (1300)
 *     ├── New Cars (1310) - SAR 60,000
 *     └── Used Cars (1320) - SAR 40,000
 *
 * LIABILITIES (2000)
 * ├── Payables (2100)
 * │   └── Suppliers (2110) - SAR 80,000
 * └── Loans (2200)
 *     └── Long-term Bank Loan (2210) - SAR 70,000
 *
 * EQUITY (3000)
 * ├── Capital (3100) - SAR 300,000
 * └── Retained Earnings (3200) - SAR 50,000
 *
 * REVENUE (4000)
 * ├── Car Sales (4100)
 * │   ├── New Car Sales (4110) - SAR 800,000
 * │   └── Used Car Sales (4120) - SAR 400,000
 * └── Other Income (4200)
 *     ├── Maintenance & Repair (4210) - SAR 200,000
 *     └── Interest Income (4220) - SAR 100,000
 *
 * EXPENSES (5000)
 * ├── Cost of Goods Sold (5100)
 * │   ├── Car Costs (5110) - SAR 400,000
 * │   └── Transport & Storage (5120) - SAR 100,000
 * ├── Administrative Expenses (5200)
 * │   ├── Employee Salaries (5210) - SAR 120,000
 * │   ├── Office Rent (5220) - SAR 40,000
 * │   └── Utilities (5230) - SAR 25,000
 * └── Selling Expenses (5300)
 *     ├── Advertising & Marketing (5310) - SAR 60,000
 *     └── Sales Commissions (5320) - SAR 40,000
 */

// 7. INTEGRATION WITH OTHER SYSTEMS
// ===================================

/**
 * The AccountTreeComponent integrates with:
 * 
 * 1. JOURNAL ENTRY SYSTEM
 *    - AccountingService uses chart accounts for journal entries
 *    - Sales returns create entries in assets/liability accounts
 *    - Purchase returns adjust inventory and payables accounts
 *
 * 2. REPORTING SYSTEM
 *    - Balance sheet generation from account balances
 *    - Income statement using revenue/expense accounts
 *    - Trial balance verification
 *
 * 3. FINANCIAL STATEMENTS
 *    - Asset accounts (1000) → Balance Sheet
 *    - Liability accounts (2000) → Balance Sheet
 *    - Equity accounts (3000) → Balance Sheet
 *    - Revenue accounts (4000) → Income Statement
 *    - Expense accounts (5000) → Income Statement
 */
