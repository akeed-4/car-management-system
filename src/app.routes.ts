
import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { InventoryListComponent } from './components/inventory/inventory-list/inventory-list.component';
import { InventoryFormComponent } from './components/inventory/inventory-form/inventory-form.component';
import { SalesComponent } from './components/sales/sales.component';
import { ProcurementComponent } from './components/procurement/procurement.component';
import { UsersComponent } from './components/users/users.component';
import { SalesInvoiceComponent } from './components/sales/sales-invoice/sales-invoice.component';
import { PurchaseInvoiceComponent } from './components/procurement/purchase-invoice/purchase-invoice.component';
import { CustomersComponent } from './components/entities/customers/customers.component';
import { SuppliersComponent } from './components/entities/suppliers/suppliers.component';
import { FinancialReportsComponent } from './components/reports/financial-reports/financial-reports.component';
import { TaxReportsComponent } from './components/reports/tax-reports/tax-reports.component';
import { AdministrativeReportsComponent } from './components/reports/administrative-reports/administrative-reports.component';
import { ManufacturersComponent } from './components/setup/manufacturers/manufacturers.component';
import { CarModelsComponent } from './components/setup/car-models/car-models.component';
import { ManufactureYearComponent } from './components/setup/manufacture-year/manufacture-year.component';
import { CustomerFormComponent } from './components/entities/customers/customer-form/customer-form.component';
import { SupplierFormComponent } from './components/entities/suppliers/supplier-form/supplier-form.component';
import { SalesReturnInvoiceComponent } from './components/sales/sales-return-invoice/sales-return-invoice.component';
import { PurchaseReturnInvoiceComponent } from './components/procurement/purchase-return-invoice/purchase-return-invoice.component';
import { PrintableSalesInvoiceComponent } from './components/sales/printable-sales-invoice/printable-sales-invoice.component';
import { PrintablePurchaseInvoiceComponent } from './components/procurement/printable-purchase-invoice/printable-purchase-invoice.component';
import { StockTakingComponent } from './components/inventory/stock-taking/stock-taking.component';
import { StockTakingApprovalComponent } from './components/inventory/stock-taking-approval/stock-taking-approval.component';
import { SalesReturnFormComponent } from './components/sales/sales-return-form/sales-return-form.component';
import { PurchaseReturnFormComponent } from './components/procurement/purchase-return-form/purchase-return-form.component';
import { StockTakingFormComponent } from './components/inventory/stock-taking-form/stock-taking-form.component';
import { StockTakingApprovalFormComponent } from './components/inventory/stock-taking-approval-form/stock-taking-approval-form.component';
import { UserFormComponent } from './components/users/user-form/user-form.component';
import { RolesComponent } from './components/users/roles/roles.component';
import { RequestedCarsComponent } from './components/requested-cars/requested-cars.component';
import { RequestedCarFormComponent } from './components/requested-cars/requested-car-form/requested-car-form.component';
import { ExpensesComponent } from './components/expenses/expenses.component';
import { ExpenseFormComponent } from './components/expenses/expense-form/expense-form.component';
import { ReceiptsComponent } from './components/accounts/receipts/receipts.component';
import { ReceiptFormComponent } from './components/accounts/receipt-form/receipt-form.component';
import { PaymentsComponent } from './components/accounts/payments/payments.component';
import { PaymentFormComponent } from './components/accounts/payment-form/payment-form.component';
import { FloorPlanReportComponent } from './components/accounts/floor-plan-report/floor-plan-report.component';
import { TestDrivesComponent } from './components/test-drives/test-drives.component';
import { TestDriveFormComponent } from './components/test-drives/test-drive-form/test-drive-form.component';
import { MaintenanceDashboardComponent } from './components/maintenance/maintenance-dashboard/maintenance-dashboard.component';
import { ServiceOrderFormComponent } from './components/maintenance/service-order-form/service-order-form.component';
import { DeliveryScheduleComponent } from './components/delivery/delivery-schedule/delivery-schedule.component';
import { DeliveryFormComponent } from './components/delivery/delivery-form/delivery-form.component';
import { ConsignmentListComponent } from './components/consignment/consignment-list/consignment-list.component';
import { ConsignmentFormComponent } from './components/consignment/consignment-form/consignment-form.component';
import { DepositListComponent } from './components/accounts/deposits/deposit-list/deposit-list.component';
import { DepositFormComponent } from './components/accounts/deposits/deposit-form/deposit-form.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegistrationComponent } from './components/auth/registration/registration.component';
import { LayoutComponent } from './components/shared/layout/layout.component';
import { CarCardComponent } from './components/setup/car-card/car-card.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'setup/manufacturers', component: ManufacturersComponent },
  { path: 'setup/models', component: CarModelsComponent },
  { path: 'setup/year', component: ManufactureYearComponent },
      { path: 'setup/card', component :CarCardComponent }, // Redirect to the functional inventory form
      { path: 'inventory', component: InventoryListComponent },
  { path: 'inventory/new', component: InventoryFormComponent },
  { path: 'inventory/edit/:id', component: InventoryFormComponent },
  { path: 'inventory/stock-taking', component: StockTakingComponent },
  { path: 'inventory/stock-taking/new', component: StockTakingFormComponent },
  { path: 'inventory/stock-taking/edit/:id', component: StockTakingFormComponent },
  { path: 'inventory/stock-taking-approval', component: StockTakingApprovalComponent },
  { path: 'inventory/stock-taking-approval/new', component: StockTakingApprovalFormComponent },
  { path: 'requested-cars', component: RequestedCarsComponent },
  { path: 'requested-cars/new', component: RequestedCarFormComponent },
  { path: 'requested-cars/edit/:id', component: RequestedCarFormComponent },
  { path: 'consignment-cars', component: ConsignmentListComponent },
  { path: 'consignment-cars/new', component: ConsignmentFormComponent },
  { path: 'consignment-cars/edit/:id', component: ConsignmentFormComponent },
  { path: 'sales', component: SalesComponent },
  { path: 'sales/invoice/new', component: SalesInvoiceComponent },
  { path: 'sales/invoice/print/:id', component: PrintableSalesInvoiceComponent },
  { path: 'sales/return', component: SalesReturnInvoiceComponent },
  { path: 'sales/returns', component: SalesReturnInvoiceComponent }, // Added plural route
  { path: 'sales/return/new', component: SalesReturnFormComponent },
  { path: 'purchases', component: ProcurementComponent },
  { path: 'purchases/invoice/new', component: PurchaseInvoiceComponent },
  { path: 'purchases/invoice/print/:id', component: PrintablePurchaseInvoiceComponent },
  { path: 'purchases/return', component: PurchaseReturnInvoiceComponent },
  { path: 'purchases/returns', component: PurchaseReturnInvoiceComponent }, // Added plural route
  { path: 'purchases/return/new', component: PurchaseReturnFormComponent },
  { path: 'expenses', component: ExpensesComponent },
  { path: 'expenses/new', component: ExpenseFormComponent },
  { path: 'expenses/edit/:id', component: ExpenseFormComponent },
  { path: 'accounts/receipts', component: ReceiptsComponent },
  { path: 'accounts/receipts/new', component: ReceiptFormComponent },
  { path: 'accounts/payments', component: PaymentsComponent },
  { path: 'accounts/payments/new', component: PaymentFormComponent },
  { path: 'accounts/deposits', component: DepositListComponent }, // New Deposit List
  { path: 'accounts/deposits/new', component: DepositFormComponent }, // New Deposit Form
  { path: 'accounts/deposits/new/:carId', component: DepositFormComponent }, // New Deposit Form with pre-selected car
  { path: 'accounts/floor-plan-financing', component: FloorPlanReportComponent },
  { path: 'entities/customers', component: CustomersComponent },
  { path: 'entities/customers/new', component: CustomerFormComponent },
  { path: 'entities/customers/edit/:id', component: CustomerFormComponent },
  { path: 'entities/suppliers', component: SuppliersComponent },
  { path: 'entities/suppliers/new', component: SupplierFormComponent },
  { path: 'entities/suppliers/edit/:id', component: SupplierFormComponent },
  { path: 'reports/financial', component: FinancialReportsComponent },
  { path: 'reports/tax', component: TaxReportsComponent },
  { path: 'reports/administrative', component: AdministrativeReportsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'users/new', component: UserFormComponent },
  { path: 'users/edit/:id', component: UserFormComponent },
  { path: 'users/roles', component: RolesComponent },
  { path: 'test-drives', component: TestDrivesComponent },
  { path: 'test-drives/new', component: TestDriveFormComponent },
  { path: 'test-drives/edit/:id', component: TestDriveFormComponent },
  { path: 'maintenance', component: MaintenanceDashboardComponent },
  { path: 'maintenance/new', component: ServiceOrderFormComponent },
  { path: 'maintenance/edit/:id', component: ServiceOrderFormComponent },
  { path: 'deliveries', component: DeliveryScheduleComponent },
  { path: 'deliveries/schedule/:invoiceId', component: DeliveryFormComponent },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: '/dashboard' }
    ]
  }
];
