# Sales Lifecycle Management System - Quick Start Guide

## 🚀 Introduction

A comprehensive Angular-based sales lifecycle management system for car dealerships, supporting three distinct sales channels:

- **افراد (Afrad)** - Individual/Retail Sales
- **شركات (Sharikat)** - Corporate/Fleet Sales  
- **بنوك (Bunuk)** - Bank/Finance Sales

## 📋 Prerequisites

- Node.js 18+ 
- Angular CLI 17+
- .NET Core 8+ (Backend API)
- SQL Server (Database)

## 🏗️ Project Structure

```
car-management-system/
├── src/
│   ├── models/
│   │   ├── enums/
│   │   │   ├── sales-channel.enum.ts
│   │   │   └── invoice-status.enum.ts
│   │   └── sales-lifecycle/
│   │       ├── afrad-sales-order.model.ts
│   │       ├── sharikat-sales-order.model.ts
│   │       ├── bunuk-sales-order.model.ts
│   │       └── sales-invoice-engine.model.ts
│   ├── services/
│   │   ├── afrad-sales.service.ts
│   │   ├── sharikat-sales.service.ts
│   │   ├── bunuk-sales.service.ts
│   │   └── sales-invoice-engine.service.ts
│   ├── components/
│   │   └── sales/
│   │       └── sales-lifecycle-dashboard/
│   └── assets/
│       └── i18n/
│           ├── en.json (English translations)
│           └── ar.json (Arabic translations)
└── SALES_LIFECYCLE_DOCUMENTATION.md
```

## 🔧 Installation

```bash
# Clone repository
git clone <repository-url>

# Navigate to project
cd car-management-system

# Install dependencies
npm install

# Run development server
ng serve

# Navigate to http://localhost:4200
```

## 🎯 Quick Feature Overview

### 1. Afrad Sales (Individual)
- Create personal sales orders
- Link advance payment vouchers (deposits)
- Automatically reserve vehicles
- Track financing options
- Generate invoices

### 2. Sharikat Sales (Corporate)
- Convert quotations to orders
- Check corporate credit limits
- Allocate multiple VINs
- Approval workflow integration
- Track purchase orders

### 3. Bunuk Sales (Finance)
- Bank financing applications
- Taameed tracking
- Document checklist management
- Finance calculation engine
- Settlement tracking

## 🌐 API Endpoints

### Afrad Sales API
```
GET    /api/AfradSales              - List all orders
POST   /api/AfradSales              - Create order
GET    /api/AfradSales/{id}         - Get order details
PUT    /api/AfradSales/{id}         - Update order
POST   /api/AfradSales/reserve      - Reserve vehicle
POST   /api/AfradSales/{id}/approve - Approve order
```

### Sharikat Sales API
```
GET    /api/SharikatSales                   - List all orders
POST   /api/SharikatSales                   - Create order  
POST   /api/SharikatSales/convert-quotation - Convert quotation
POST   /api/SharikatSales/check-credit      - Check credit limit
POST   /api/SharikatSales/{id}/allocate-vehicles - Allocate VINs
```

### Bunuk Sales API
```
GET    /api/BunukSales                     - List all orders
POST   /api/BunukSales                     - Create order
POST   /api/BunukSales/calculate-finance   - Calculate terms
POST   /api/BunukSales/submit-application  - Submit to bank
POST   /api/BunukSales/update-taameed      - Update Taameed info
```

### Invoice Engine API
```
POST   /api/SalesInvoiceEngine/process-order      - Generate invoice
POST   /api/SalesInvoiceEngine/record-payment     - Record payment
POST   /api/SalesInvoiceEngine/confirm-delivery   - Confirm delivery
POST   /api/SalesInvoiceEngine/{id}/generate-qr   - Generate ZATCA QR
```

## 💡 Usage Examples

### Create Individual Sales Order

```typescript
import { AfradSalesService } from './services/afrad-sales.service';

constructor(private afradService: AfradSalesService) {}

createOrder(): void {
  const dto = {
    customerId: 123,
    vehicleId: 456,
    totalAmount: 100000,
    advancePaymentAmount: 20000,
    isFinanced: false,
    branchId: 1
  };

  this.afradService.create(dto).subscribe({
    next: (order) => {
      console.log('Order created:', order);
      this.router.navigate(['/sales/lifecycle/afrad', order.id]);
    },
    error: (error) => {
      console.error('Error:', error);
    }
  });
}
```

### Check Corporate Credit Limit

```typescript
import { SharikatSalesService } from './services/sharikat-sales.service';

constructor(private sharikatService: SharikatSalesService) {}

checkCredit(): void {
  const dto = {
    customerId: 789,
    requestedAmount: 500000
  };

  this.sharikatService.checkCreditLimit(dto).subscribe({
    next: (result) => {
      if (result.requiresApproval) {
        alert('Amount exceeds credit limit - approval required');
      } else {
        this.proceedWithOrder();
      }
    }
  });
}
```

### Calculate Finance Terms

```typescript
import { BunukSalesService } from './services/bunuk-sales.service';

constructor(private bunukService: BunukSalesService) {}

calculateFinance(): void {
  this.bunukService.calculateFinance(
    150000,  // vehiclePrice
    30,      // downPaymentPercentage
    60,      // financeTerm (months)
    5.5,     // profitRate
    {
      adminFees: 500,
      insuranceAmount: 3000
    }
  ).subscribe({
    next: (result) => {
      console.log('Monthly Installment:', result.monthlyInstallment);
      console.log('Grand Total:', result.grandTotal);
    }
  });
}
```

## 🎨 UI Components

### Dashboard Navigation

```html
<!-- Navigate to sales lifecycle dashboard -->
<a routerLink="/sales/lifecycle">Sales Lifecycle</a>

<!-- Component will display three tabs:
1. Afrad (Individual) Sales
2. Sharikat (Corporate) Sales  
3. Bunuk (Bank/Finance) Sales
-->
```

### Using Translations

```html
<!-- English/Arabic bilingual support -->
<h1>{{ 'SALES_LIFECYCLE.TITLE' | translate }}</h1>
<span>{{ 'SALES_LIFECYCLE.CHANNELS.AFRAD' | translate }}</span>
<span>{{ 'SALES_LIFECYCLE.STATS.TOTAL_ORDERS' | translate }}</span>
```

## 🔐 Security

All API endpoints require authentication:

```typescript
// JWT token automatically included via HttpInterceptor
import { JwtInterceptor } from './interceptors/jwt.interceptor';
```

## 📊 Business Logic

### Ledger Routing (Double-Entry Accounting)

**Afrad Sales**:
```
Debit:  Cash Account (Type 1)
Credit: Sales (Type 12) + VAT (Type 18)
```

**Sharikat Sales**:
```
Debit:  Clients Account (Type 2)
Credit: Sales (Type 12) + VAT (Type 18)
[+ Approval if credit exceeded]
```

**Bunuk Sales**:
```
Debit:  Banks Account (Type 4)
Credit: Sales (Type 12) + VAT (Type 18)
```

### Vehicle Status Flow

```
Available → Reserved → Sold
```

### ZATCA Compliance

Automatic QR code generation with TLV encoding for Saudi e-invoicing compliance.

## 🧪 Testing

```bash
# Run unit tests
ng test

# Run e2e tests
ng e2e

# Run with coverage
ng test --code-coverage
```

## 📱 Responsive Design

- Desktop: Full dashboard with grids
- Tablet: Condensed layout
- Mobile: Card-based view with collapsible sections

## 🌍 Internationalization

Supports English (en) and Arabic (ar):

```typescript
// Switch language
this.translate.use('ar'); // Arabic
this.translate.use('en'); // English
```

## 🐛 Troubleshooting

### Common Issues

**Issue**: API connection refused  
**Solution**: Check `environment.ts` apiUrl configuration

**Issue**: Translations not loading  
**Solution**: Verify i18n files in `assets/i18n/`

**Issue**: Data grid not rendering  
**Solution**: Ensure DevExtreme license is configured

## 📚 Additional Resources

- [Full Documentation](./SALES_LIFECYCLE_DOCUMENTATION.md)
- [API Reference](./API_REFERENCE.md)
- [Business Rules](./BUSINESS_RULES.md)

## 👥 Team

- **Backend Architect**: .NET Core Expert
- **Frontend Developer**: Angular Specialist
- **UX Designer**: Material Design Expert
- **QA Engineer**: Testing Specialist

## 📄 License

Proprietary - Car Dealership Management System

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

For support, email support@cardealer.com or open an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Production Ready ✅
