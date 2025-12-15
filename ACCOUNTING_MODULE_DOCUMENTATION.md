# Accounting Module Documentation

## Overview
The Accounting module provides comprehensive accounting functionality for the car management system, including chart of accounts management and journal entries with double-entry bookkeeping.

## Features

### 1. Chart of Accounts (MatTree)
- **Hierarchical account structure** using Angular Material Tree
- **Account types**: Asset, Liability, Equity, Revenue, Expense
- **CRUD operations**: Create, Read, Update, Delete accounts
- **Parent-child relationships** for account hierarchy
- **RTL support** for Arabic language
- **Responsive design** for desktop and mobile

### 2. Journal Entries (MatTable)
- **Double-entry bookkeeping** with debit/credit validation
- **Multiple journal lines** per entry
- **Balance validation** ensuring debit = credit
- **Account selection** from chart of accounts
- **Date and reference tracking**
- **CRUD operations** for journal entries

### 3. Accounting Service
- **Observable-based data management**
- **CRUD operations** for accounts and journal entries
- **Balance validation** for journal entries
- **Sample data** for demonstration

## File Structure

```
src/components/accounting/
├── accounting.module.ts          # Main module with all imports
├── accounting.component.ts       # Main component with tabs
├── accounting.component.html     # Tab navigation
├── accounting.component.css      # Shared styles
├── chart-of-accounts.component.ts    # Tree component
├── chart-of-accounts.component.html  # Tree template
├── journal-entries.component.ts      # Table component
├── journal-entries.component.html    # Table template
├── accounting.service.ts         # Data service
└── models.ts                     # TypeScript interfaces
```

## Models

### Account
```typescript
interface Account {
  id: number;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId?: number;
  balance: number;
  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;
}
```

### JournalEntry
```typescript
interface JournalEntry {
  id: number;
  date: Date;
  description: string;
  reference?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdDate: Date;
  updatedDate: Date;
}
```

## Usage

### Import Module
```typescript
import { AccountingModule } from './components/accounting/accounting.module';

@NgModule({
  imports: [AccountingModule]
})
export class AppModule { }
```

### Use Components
```html
<!-- Main accounting component with tabs -->
<app-accounting></app-accounting>

<!-- Individual components -->
<app-chart-of-accounts></app-chart-of-accounts>
<app-journal-entries></app-journal-entries>
```

### Routing
```typescript
const routes: Routes = [
  {
    path: 'accounting',
    component: AccountingComponent,
    children: [
      { path: 'chart-of-accounts', component: ChartOfAccountsComponent },
      { path: 'journal-entries', component: JournalEntriesComponent }
    ]
  }
];
```

## Validation Rules

### Account Validation
- Code: Required, minimum 3 characters
- Name: Required, minimum 2 characters
- Type: Required selection

### Journal Entry Validation
- Date: Required
- Description: Required, minimum 5 characters
- At least one journal line required
- Each line must have account selected
- Debit and credit amounts must be >= 0
- Total debit must equal total credit (balanced)

## Translations

### English (en.json)
```json
"ACCOUNTING": {
  "CHART_OF_ACCOUNTS": "Chart of Accounts",
  "JOURNAL_ENTRIES": "Journal Entries",
  "ADD_ACCOUNT": "Add Account",
  "ACCOUNT_CODE": "Account Code",
  "ACCOUNT_NAME": "Account Name",
  // ... more keys
}
```

### Arabic (ar.json)
```json
"ACCOUNTING": {
  "CHART_OF_ACCOUNTS": "شجرة الحسابات",
  "JOURNAL_ENTRIES": "قيود اليومية",
  "ADD_ACCOUNT": "إضافة حساب",
  // ... more keys
}
```

## Responsive Design

### Desktop (>768px)
- Side-by-side layout for tree/table and forms
- Full width forms and tables

### Mobile (≤768px)
- Stacked layout
- Compact forms
- Touch-friendly buttons

## Dependencies

- Angular Material (Tree, Table, Forms, Datepicker, Tabs)
- Angular Reactive Forms
- ngx-translate for internationalization
- RxJS for observables

## Sample Data

The service includes sample data:
- 6 accounts across all types
- 1 sample journal entry
- Proper balance relationships

## Future Enhancements

- Financial reports generation
- Account balance calculations
- Trial balance
- General ledger
- Backend API integration
- Audit trail
- Multi-company support