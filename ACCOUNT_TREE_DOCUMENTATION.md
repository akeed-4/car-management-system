# AccountTreeComponent - Chart of Accounts

## 📊 Overview

The **AccountTreeComponent** is a production-ready Angular component that displays and manages a hierarchical chart of accounts using DevExtreme TreeList. It's designed for financial/accounting systems with full CRUD (Create, Read, Update, Delete) operations.

## 🎯 Features

### Display Features
- ✅ **Hierarchical Tree Structure**: Full support for parent-child account relationships
- ✅ **Expandable/Collapsible Nodes**: Users can expand/collapse categories
- ✅ **Currency Formatting**: Balances displayed as SAR currency format
- ✅ **RTL Support**: Full Right-to-Left support for Arabic language
- ✅ **Responsive Design**: Works on mobile, tablet, and desktop devices
- ✅ **Multi-language**: English and Arabic translations included

### CRUD Operations
- ✅ **Create**: Add new accounts with parent account selection
- ✅ **Read**: Display complete chart of accounts with 60+ sample accounts
- ✅ **Update**: Edit existing account properties (code, name, type, parent)
- ✅ **Delete**: Remove accounts with validation to prevent orphaning child accounts

### Data Structure
- Account ID (unique identifier)
- Account Code (e.g., "1110", "4120")
- Account Name (in Arabic/English)
- Account Type: `PARENT` (category) or `ACCOUNT` (leaf node)
- Parent ID (for hierarchy)
- Balance (with currency formatting)

## 📁 File Structure

```
src/
├── components/
│   └── setup/
│       └── account-tree/
│           ├── account-tree.component.ts      (Main component logic)
│           ├── account-tree.component.html    (Template)
│           └── account-tree.component.css     (Styling)
├── services/
│   └── chart-of-accounts.service.ts           (API/Data service)
├── types/
│   └── account-node.model.ts                  (TypeScript interfaces)
└── assets/i18n/
    ├── en.json                                (English translations)
    └── ar.json                                (Arabic translations)
```

## 🚀 Usage

### 1. Import in Routing
```typescript
import { Routes } from '@angular/router';
import { AccountTreeComponent } from './components/setup/account-tree/account-tree.component';

export const setupRoutes: Routes = [
  {
    path: 'chart-of-accounts',
    component: AccountTreeComponent,
    data: { title: 'Chart of Accounts' }
  }
];
```

### 2. Use in Parent Component
```typescript
import { AccountTreeComponent } from './components/setup/account-tree/account-tree.component';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [AccountTreeComponent],
  template: `<app-account-tree></app-account-tree>`
})
export class SetupComponent {}
```

### 3. Programmatic Usage
```typescript
import { ChartOfAccountsService } from './services/chart-of-accounts.service';

export class MyComponent implements OnInit {
  private chartService = inject(ChartOfAccountsService);

  ngOnInit() {
    // Get all accounts
    this.chartService.getAccounts().subscribe(accounts => {
      console.log('Accounts:', accounts);
    });

    // Create new account
    this.chartService.createAccount({
      code: '5400',
      name: 'Other Expenses',
      type: 'PARENT'
    }).subscribe(account => console.log('Created:', account));
  }
}
```

## 📊 Default Chart of Accounts Structure

The component initializes with 60+ sample accounts organized into 5 main categories:

### Assets (1000) - SAR 500,000
- Cash & Banks (1100) - SAR 250,000
  - Cash in Drawer (1110) - SAR 50,000
  - Bank Account (1120) - SAR 200,000
- Receivables (1200) - SAR 150,000
  - Customers (1210) - SAR 100,000
  - Notes Receivable (1220) - SAR 50,000
- Inventory (1300) - SAR 100,000
  - New Cars (1310) - SAR 60,000
  - Used Cars (1320) - SAR 40,000

### Liabilities (2000) - SAR 150,000
- Payables (2100) - SAR 80,000
  - Suppliers (2110) - SAR 80,000
- Loans (2200) - SAR 70,000
  - Long-term Bank Loan (2210) - SAR 70,000

### Equity (3000) - SAR 350,000
- Capital (3100) - SAR 300,000
- Retained Earnings (3200) - SAR 50,000

### Revenue (4000) - SAR 1,500,000
- Car Sales (4100) - SAR 1,200,000
  - New Car Sales (4110) - SAR 800,000
  - Used Car Sales (4120) - SAR 400,000
- Other Income (4200) - SAR 300,000
  - Maintenance & Repair (4210) - SAR 200,000
  - Interest Income (4220) - SAR 100,000

### Expenses (5000) - SAR 800,000
- Cost of Goods Sold (5100) - SAR 500,000
  - Car Costs (5110) - SAR 400,000
  - Transport & Storage (5120) - SAR 100,000
- Administrative Expenses (5200) - SAR 200,000
  - Employee Salaries (5210) - SAR 120,000
  - Office Rent (5220) - SAR 40,000
  - Utilities (5230) - SAR 25,000
- Selling Expenses (5300) - SAR 100,000
  - Advertising & Marketing (5310) - SAR 60,000
  - Sales Commissions (5320) - SAR 40,000

## 🎨 UI Components

### Header Section
- Title: "الشجرة المحاسبية" (Chart of Accounts)
- Add Account Button with icon
- Professional gradient background

### TreeList
- **Columns**:
  - Account Code (left-aligned, 100px width)
  - Account Name (250px width)
  - Account Type (120px width)
  - Balance (currency formatted, 150px width)
- Sortable and filterable columns
- Column reordering enabled
- Column hiding enabled
- Word wrap enabled for long text

### Action Buttons
- Edit Button (blue): Opens edit dialog
- Delete Button (red): Opens confirmation dialog
- Buttons only show for accounts without children

### Dialogs

#### Add Account Dialog
- Code input (required, min 3 chars)
- Name input (required, min 2 chars)
- Type dropdown (PARENT or ACCOUNT)
- Parent Account dropdown (optional)
- Save and Cancel buttons

#### Edit Account Dialog
- All fields same as Add Account
- Pre-populated with current account data
- Cannot edit account ID
- Update and Cancel buttons

#### Delete Confirmation Dialog
- Account details display
- Confirmation message with account code and name
- Delete and Cancel buttons
- Prevents deletion if account has children

## 🔧 API Methods

### ChartOfAccountsService

```typescript
// Get all accounts
getAccounts(): Observable<AccountNode[]>

// Get account by ID
getAccountById(id: number): Observable<AccountNode>

// Create new account
createAccount(account: CreateAccountDto): Observable<AccountNode>

// Update existing account
updateAccount(account: UpdateAccountDto): Observable<AccountNode>

// Delete account
deleteAccount(id: number): Observable<void>

// Get hierarchical structure
getHierarchicalAccounts(): Observable<AccountNodeFlat[]>

// Get accounts by category
getAccountsByCategory(category: string): Observable<AccountNode[]>
```

## 📱 Responsive Design

- **Desktop (1200px+)**: Full layout with all features visible
- **Tablet (768-1199px)**: Optimized column widths, stacked buttons
- **Mobile (<768px)**: Single-column layout, simplified buttons, modal dialogs occupy 95% width

## 🌍 Internationalization (i18n)

### Supported Languages
- English (en)
- Arabic (ar)

### Key Translation Strings
```typescript
CHART_OF_ACCOUNTS: {
  TREE_TITLE: "الشجرة المحاسبية"
  ADD_ACCOUNT: "إضافة حساب"
  CODE: "رمز الحساب"
  NAME: "اسم الحساب"
  TYPE: "نوع الحساب"
  BALANCE: "الرصيد"
  // ... more keys
}
```

## ⚙️ TypeScript Interfaces

```typescript
// Account Node Model
interface AccountNode {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  type: 'PARENT' | 'ACCOUNT';
  balance?: number;
  createdDate?: Date;
  updatedDate?: Date;
}

// Create DTO
interface CreateAccountDto {
  parentId?: number | null;
  code: string;
  name: string;
  type: 'PARENT' | 'ACCOUNT';
}

// Update DTO
interface UpdateAccountDto extends CreateAccountDto {
  id: number;
}

// Delete DTO
interface DeleteAccountDto {
  id: number;
}
```

## 🎯 Integration with Accounting System

The AccountTreeComponent integrates with:

1. **AccountingService**: Uses chart accounts for journal entries
2. **Sales Return System**: Creates entries in asset/liability accounts
3. **Purchase Return System**: Adjusts inventory and payables accounts
4. **Reporting System**: Generates financial statements from account balances

### Example: Journal Entry Creation
```typescript
// Accounting service creates entries using chart of accounts
const entry = {
  debitAccountId: 2110,      // Suppliers (2110)
  creditAccountId: 1120,     // Bank (1120)
  amount: 50000,
  description: 'Payment to supplier'
};
```

## 🔒 Validation Rules

1. **Account Code**:
   - Required
   - Minimum 3 characters
   - Unique across all accounts
   - Typically numeric (1000, 1100, etc.)

2. **Account Name**:
   - Required
   - Minimum 2 characters
   - Can contain any characters (supports Unicode/Arabic)

3. **Account Type**:
   - Must be either 'PARENT' or 'ACCOUNT'
   - Parent accounts are categories, can have children
   - Leaf accounts are final destinations for entries

4. **Parent Account**:
   - Optional
   - Cannot be self-referential
   - Should not create circular references

5. **Delete Validation**:
   - Cannot delete accounts that have children
   - Cannot delete accounts with pending transactions
   - Shows appropriate error message

## 🚨 Error Handling

The component includes comprehensive error handling:
- Network errors logged to console
- User-friendly error messages displayed
- Loading states prevent duplicate submissions
- Form validation prevents invalid data submission

## 📦 Dependencies

- Angular 15+
- DevExtreme Angular Components
- Angular Material (Icons)
- ngx-translate (Internationalization)
- TypeScript 5+
- RxJS

## 🎨 Styling Features

- **Gradient backgrounds** for modern look
- **Smooth transitions** on hover effects
- **Professional color scheme** (blue, green, red)
- **Box shadows** for depth
- **RTL support** with proper text alignment
- **Print-friendly styles** included
- **Dark mode ready** (easily customizable)

## 📈 Future Enhancements

Potential improvements:
- Excel export functionality
- Bulk account creation
- Account number validation rules
- Multi-currency support
- Historical balance tracking
- Account reconciliation features
- Custom field support
- Account templates

## ✅ Testing Checklist

- [ ] Create new account with all required fields
- [ ] Create account with optional parent selection
- [ ] Edit account properties
- [ ] Attempt to delete account with children (should fail)
- [ ] Delete leaf account successfully
- [ ] Expand/collapse parent accounts
- [ ] Search/filter accounts
- [ ] Verify currency formatting
- [ ] Test RTL (Arabic) display
- [ ] Test responsive design on mobile
- [ ] Verify all error messages display correctly
- [ ] Test form validation

## 📞 Support

For issues or questions about the AccountTreeComponent, refer to the inline code documentation or contact the development team.
