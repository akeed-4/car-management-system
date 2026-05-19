# Sales Lifecycle Management System Documentation

## Overview

The Sales Lifecycle Management System is an enterprise-grade Angular application designed to handle three distinct sales channels in the car dealership industry:

1. **Afrad (Individual Sales)** - Retail sales to individual customers
2. **Sharikat (Corporate Sales)** - Fleet and bulk sales to companies
3. **Bunuk (Bank/Finance Sales)** - Financed sales through banking institutions

## Architecture

### Technology Stack

- **Frontend Framework**: Angular 17
- **UI Components**: Angular Material & DevExtreme
- **State Management**: RxJS
- **Internationalization**: ngx-translate (Arabic & English)
- **Backend Communication**: HTTP Client with RxJS Observables

### Directory Structure

```
src/
├── models/
│   ├── enums/
│   │   ├── sales-channel.enum.ts
│   │   └── invoice-status.enum.ts
│   ├── sales-lifecycle/
│   │   ├── afrad-sales-order.model.ts
│   │   ├── sharikat-sales-order.model.ts
│   │   ├── bunuk-sales-order.model.ts
│   │   └── sales-invoice-engine.model.ts
│   └── advance-payment-voucher.model.ts
├── services/
│   ├── afrad-sales.service.ts
│   ├── sharikat-sales.service.ts
│   ├── bunuk-sales.service.ts
│   └── sales-invoice-engine.service.ts
├── components/
│   └── sales/
│       └── sales-lifecycle-dashboard/
│           ├── sales-lifecycle-dashboard.component.ts
│           ├── sales-lifecycle-dashboard.component.html
│           └── sales-lifecycle-dashboard.component.css
└── assets/
    └── i18n/
        ├── en.json
        └── ar.json
```

## Data Models

### Enumerations

#### SalesChannel
```typescript
enum SalesChannel {
  Afrad = 1,      // Individual/Retail
  Sharikat = 2,   // Corporate/Fleet
  Bunuk = 3       // Bank/Finance
}
```

#### InvoiceStatus
```typescript
enum InvoiceStatus {
  Draft = 1,      // Being prepared
  Approved = 2,   // Approved, awaiting payment
  Paid = 3,       // Fully paid
  Delivered = 4   // Vehicle delivered
}
```

### Core Models

#### AfradSalesOrder (Individual Sales)
- **Purpose**: Handles personal car sales with optional financing
- **Key Features**:
  - Links to customer and vehicle
  - Supports advance payment vouchers (deposits)
  - Automatically updates vehicle status to "Reserved"
  - Optional bank financing tracking

#### SharikatSalesOrder (Corporate Sales)
- **Purpose**: Manages fleet and bulk sales to companies
- **Key Features**:
  - Converts from customer quotations
  - Tracks purchase orders
  - Credit limit checking
  - Multiple vehicle allocation
  - Approval workflow integration

#### BunukSalesOrder (Bank/Finance Sales)
- **Purpose**: Handles bank-financed vehicle sales
- **Key Features**:
  - Taameed (finance approval) tracking
  - Document checklist management
  - Finance calculation engine
  - Bank settlement tracking
  - Application status workflow

## Service Layer

### AfradSalesService

**Base URL**: `/api/AfradSales`

**Key Methods**:
- `getAll(filters?)` - Retrieve all individual sales orders
- `create(dto)` - Create new sales order
- `reserveVehicle(dto)` - Link deposit and reserve vehicle
- `approve(orderId)` - Approve sales order
- `getAllVouchers(filters?)` - Get advance payment vouchers
- `createVoucher(dto)` - Create deposit voucher

### SharikatSalesService

**Base URL**: `/api/SharikatSales`

**Key Methods**:
- `getAll(filters?)` - Retrieve all corporate sales orders
- `create(dto)` - Create new sales order
- `convertQuotationToOrder(dto)` - Transform quotation to order
- `checkCreditLimit(dto)` - Verify customer credit
- `allocateVehicles(orderId, vehicleIds)` - Assign VINs
- `submitForApproval(orderId)` - Trigger approval workflow

### BunukSalesService

**Base URL**: `/api/BunukSales`

**Key Methods**:
- `getAll(filters?)` - Retrieve all finance sales orders
- `create(dto)` - Create new sales order
- `calculateFinance(...)` - Calculate installment terms
- `submitFinanceApplication(dto)` - Send to bank
- `updateTaameedInfo(dto)` - Record finance approval
- `recordBankSettlement(dto)` - Track bank payment

### SalesInvoiceEngineService

**Base URL**: `/api/SalesInvoiceEngine`

**Key Methods**:
- `processOrderToInvoice(dto)` - Generate invoice from order
- `approve(invoiceId)` - Approve invoice
- `recordPayment(dto)` - Register payment
- `confirmDelivery(dto)` - Mark as delivered
- `generateZatcaQrCode(invoiceId)` - ZATCA compliance

## UI Components

### Sales Lifecycle Dashboard

**Component**: `SalesLifecycleDashboardComponent`

**Features**:
- Tabbed interface for three sales channels
- Real-time statistics cards
- DevExtreme DataGrids with filtering and sorting
- Search and export capabilities
- Status indicators with color coding

**Navigation**:
- Double-click row to view details
- Action buttons for creating new orders
- Refresh functionality per tab

## Workflows

### Afrad (Individual) Sales Workflow

```
1. Customer shows interest
   ↓
2. Create Advance Payment Voucher (Deposit)
   ↓
3. Create Afrad Sales Order
   ↓
4. Link Voucher to Reserve Vehicle
   (Vehicle status: Available → Reserved)
   ↓
5. Approve Sales Order
   ↓
6. Generate Invoice via Invoice Engine
   (Vehicle status: Reserved → Sold)
   ↓
7. Process Payment
   ↓
8. Deliver Vehicle
```

### Sharikat (Corporate) Sales Workflow

```
1. Create Customer Quotation
   ↓
2. Customer Approves Quotation
   ↓
3. Receive Purchase Order
   ↓
4. Convert Quotation to Sales Order
   ↓
5. Check Credit Limit
   (If exceeded → Approval Workflow)
   ↓
6. Allocate Specific VINs
   ↓
7. Generate Invoice
   ↓
8. Process Payment (Cash/Credit)
   ↓
9. Deliver Vehicles (Individual or Batch)
```

### Bunuk (Bank/Finance) Sales Workflow

```
1. Customer applies for financing
   ↓
2. Create Bunuk Sales Order
   ↓
3. Calculate Finance Terms
   ↓
4. Collect Required Documents
   ↓
5. Submit to Bank
   (Status: Submitted → Under Review)
   ↓
6. Bank Reviews Application
   ↓
7. Receive Taameed (Approval)
   (Status: Bank Approved)
   ↓
8. Generate Invoice
   ↓
9. Bank Settles Payment
   ↓
10. Deliver Vehicle
```

## Invoice Engine Logic

The `SalesInvoiceEngine` implements sophisticated financial routing:

### Dynamic Ledger Routing

**For Afrad Channel**:
```
Debit: Cash Account (Type 1)
Credit: Sales Account (Type 12) + VAT Account (Type 18)
```

**For Sharikat Channel**:
```
If within credit limit:
  Debit: Clients Account (Type 2)
  Credit: Sales Account (Type 12) + VAT Account (Type 18)

If exceeds credit limit:
  → Trigger Approval Workflow
  → Lock until manager approval
```

**For Bunuk Channel**:
```
Debit: Banks Account (Type 4)
Credit: Sales Account (Type 12) + VAT Account (Type 18)
```

### ZATCA Compliance

The engine generates TLV (Tag-Length-Value) encoded QR codes containing:
- Company Name
- VAT Registration Number
- Invoice Timestamp
- Total Amount (including VAT)
- VAT Amount

## Translations

The system supports full bilingual operation (English/Arabic):

### Translation Keys Structure

```json
{
  "SALES_LIFECYCLE": {
    "TITLE": "Sales Lifecycle Management",
    "CHANNELS": {
      "AFRAD": "Individual Sales",
      "SHARIKAT": "Corporate Sales",
      "BUNUK": "Bank Finance Sales"
    },
    "STATS": { ... },
    "STATUS": { ... }
  }
}
```

### Using Translations

```html
<h1>{{ 'SALES_LIFECYCLE.TITLE' | translate }}</h1>
<span>{{ 'SALES_LIFECYCLE.CHANNELS.AFRAD' | translate }}</span>
```

## Integration Points

### Existing Domain Entities

The system integrates with:

- **Customer** - Customer management
- **Car** - Inventory with status tracking
- **Bank** - Financial institutions
- **ApprovalProcess** - Workflow engine
- **AdvancePaymentVoucher** - Deposit management

### Car Status Updates

The system automatically manages vehicle status:

```typescript
Available → Reserved (when deposit linked)
Reserved → Sold (when invoice generated)
```

## Best Practices

### Error Handling

```typescript
this.service.create(dto).subscribe({
  next: (result) => {
    // Success handling
    this.showSuccessMessage();
    this.router.navigate(['/sales/lifecycle']);
  },
  error: (error) => {
    // Error handling
    this.showErrorMessage(error.message);
  }
});
```

### Loading States

```typescript
isLoading = false;

loadData(): void {
  this.isLoading = true;
  this.service.getAll().subscribe({
    next: (data) => {
      this.data = data;
      this.isLoading = false;
    },
    error: () => {
      this.isLoading = false;
    }
  });
}
```

### Filtering & Search

```typescript
const filters = {
  status: 'Approved',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  customerId: 123
};

this.service.getAll(filters).subscribe(data => {
  this.filteredData = data;
});
```

## Security Considerations

1. **Authentication**: All API calls require valid JWT tokens
2. **Authorization**: Role-based access control per channel
3. **Data Validation**: Client and server-side validation
4. **Audit Trail**: All operations logged with user and timestamp

## Performance Optimization

1. **Lazy Loading**: Components loaded on demand
2. **Virtual Scrolling**: For large data grids
3. **Caching**: Service-level caching for reference data
4. **Debounce**: Search inputs debounced at 300ms

## Testing

### Unit Testing

```typescript
describe('AfradSalesService', () => {
  it('should create sales order', () => {
    const dto = { /* test data */ };
    service.create(dto).subscribe(result => {
      expect(result.id).toBeDefined();
    });
  });
});
```

### Integration Testing

Test workflows end-to-end including API integration.

## Deployment

### Production Build

```bash
ng build --configuration=production
```

### Environment Configuration

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.cardealer.com'
};
```

## Support & Maintenance

For questions or issues:
- Technical Lead: [Contact Info]
- Documentation: [Wiki URL]
- Issue Tracker: [Jira URL]

## Changelog

### Version 1.0.0 (2025-01-XX)
- Initial release
- Three sales channels implementation
- Invoice engine with ZATCA compliance
- Bilingual support (EN/AR)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Author**: Development Team
