
import { Routes } from '@angular/router';
import { permissionGuard } from './guards/permission.guard';
import { subscriptionGuard } from './guards/subscription.guard';
import { tenantGuard } from './guards/tenant.guard';
import { guestGuard } from './guards/guest.guard';
import { companySelectedGuard } from './guards/company-selected.guard';
import { DashboardComponent } from './components/dashboard/dashboard-main/dashboard.component';
import { InventoryListComponent } from './components/inventory/inventory-list/inventory-list.component';
import { InventoryFormComponent } from './components/inventory/inventory-form/inventory-form.component';
import { PurchasesComponent } from './components/purchases/purchases-list/purchases.component';
import { UsersComponent } from './components/users/users-list/users.component';
import { UserProfileComponent } from './components/users/user-profile/user-profile.component';
import { SalesInvoiceFormComponent } from './components/sales/sales-invoice-form/sales-invoice-form.component';
import { InvoiceCreditListComponent } from './components/sales/invoice-credit-list/invoice-credit-list.component';
import { PurchaseInvoiceComponent } from './components/purchases/purchase-invoice/purchase-invoice.component';
import { CustomersComponent } from './components/entities/customers/customers-list/customers.component';
import { SuppliersComponent } from './components/entities/suppliers/suppliers-list/suppliers.component';
import { FinancialReportsComponent } from './components/reports/financial-reports/financial-reports.component';
import { TaxReportsComponent } from './components/reports/tax-reports/tax-reports.component';
import { AdministrativeReportsComponent } from './components/reports/administrative-reports/administrative-reports.component';
import { ManufacturersComponent } from './components/setup/manufacturers/manufacturers-list/manufacturers.component';
import { CarModelsComponent } from './components/setup/car-models/car-models-list/car-models.component';
import { ManufactureYearComponent } from './components/setup/manufacture-year/manufacture-year-list/manufacture-year.component';
import { CustomerFormComponent } from './components/entities/customers/customer-form/customer-form.component';
import { SupplierFormComponent } from './components/entities/suppliers/supplier-form/supplier-form.component';
import { SalesReturnInvoiceListComponent } from './components/sales/sales-return-invoice-list/sales-return-invoice-list/sales-return-invoice-list.component';
import { PurchaseReturnInvoiceComponent } from './components/purchases/purchase-return-invoice/purchase-return-invoice.component';
import { PrintableSalesInvoiceComponent } from './components/sales/printable-sales-invoice/printable-sales-invoice.component';
import { PrintablePurchaseInvoiceComponent } from './components/purchases/printable-purchase-invoice/printable-purchase-invoice.component';
import { StockTakingComponent } from './components/inventory/stock-taking/stock-taking.component';
import { StockTakingApprovalComponent } from './components/inventory/stock-taking-approval/stock-taking-approval.component';
import { SalesReturnFormComponent } from './components/sales/sales-return-form/sales-return-form.component';
import { CashInvoiceFormComponent } from './components/sales/sales-return-form/cash-invoice-form/cash-invoice-form.component';
import { CreditInvoiceFormComponent } from './components/sales/sales-return-form/credit-invoice-form/credit-invoice-form.component';
import { PurchaseReturnFormComponent } from './components/purchases/purchase-return-form/purchase-return-form.component';
import { StockTakingFormComponent } from './components/inventory/stock-taking-form/stock-taking-form.component';
import { StockTakingApprovalFormComponent } from './components/inventory/stock-taking-approval-form/stock-taking-approval-form.component';
import { UserFormComponent } from './components/users/user-form/user-form.component';
import { PurchaseCashInvoiceComponent } from './components/purchases/purchase-invoice-form/purchase-cash-invoice/purchase-cash-invoice.component';
import { PurchaseCreditInvoiceComponent } from './components/purchases/purchase-invoice-form/purchase-credit-invoice/purchase-credit-invoice.component';
import { CashPurchaseInvoiceListComponent } from './components/purchases/purchase-invoice-list/cash-purchase-invoice-list/cash-purchase-invoice-list.component';
import { CreditPurchaseInvoiceListComponent } from './components/purchases/purchase-invoice-list/credit-purchase-invoice-list/credit-purchase-invoice-list.component';
import { CashPurchaseReturnComponent } from './components/purchases/purchase-returns/cash-purchase-return/cash-purchase-return.component';
import { CreditPurchaseReturnComponent } from './components/purchases/purchase-returns/credit-purchase-return/credit-purchase-return.component';
import { CashReturnInvoiceListComponent } from './components/purchases/purchase-invoice-return-list/cash-return-invoice-list/cash-return-invoice-list.component';
import { CreditReturnInvoiceListComponent } from './components/purchases/purchase-invoice-return-list/credit-return-invoice-list/credit-return-invoice-list.component';
import { SalesCashReturnInvoiceListComponent } from './components/sales/sales-return-invoice-list/cash-return-invoice-list/cash-return-invoice-list.component';
import { SalesCreditReturnInvoiceListComponent } from './components/sales/sales-return-invoice-list/credit-return-invoice-list/credit-return-invoice-list.component';
import { RolesComponent } from './components/users/roles/roles.component';
import { RequestedCarsComponent } from './components/requested-cars/requested-cars-list/requested-cars.component';
import { RequestedCarFormComponent } from './components/requested-cars/requested-car-form/requested-car-form.component';
import { ExpensesComponent } from './components/expenses/expenses-list/expenses.component';
import { ExpenseFormComponent } from './components/expenses/expense-form/expense-form.component';
import { ReceiptsComponent } from './components/accounts/receipts/receipts.component';
import { ReceiptFormComponent } from './components/accounts/receipt-form/receipt-form.component';
import { PaymentsComponent } from './components/accounts/payments/payments.component';
import { PaymentFormComponent } from './components/accounts/payment-form/payment-form.component';
import { FloorPlanReportComponent } from './components/accounts/floor-plan-report/floor-plan-report.component';
import { TestDrivesComponent } from './components/test-drives/test-drives-list/test-drives.component';
import { TestDriveFormComponent } from './components/test-drives/test-drive-form/test-drive-form.component';
import { MaintenanceDashboardComponent } from './components/maintenance/maintenance-dashboard/maintenance-dashboard.component';
import { ServiceOrderFormComponent } from './components/maintenance/service-order-form/service-order-form.component';
import { DeliveryScheduleComponent } from './components/delivery/delivery-schedule/delivery-schedule.component';
import { DeliveryFormComponent } from './components/delivery/delivery-form/delivery-form.component';
import { ConsignmentListComponent } from './components/consignment/consignment-list/consignment-list.component';
import { ConsignmentFormComponent } from './components/consignment/consignment-form/consignment-form.component';
import { DailyEntriesListComponent } from './components/daily-entries/daily-entries-list/daily-entries-list.component';
import { DailyEntryFormComponent } from './components/daily-entries/daily-entry-form/daily-entry-form.component';
import { DepositListComponent } from './components/accounts/deposits/deposit-list/deposit-list.component';
import { DepositFormComponent } from './components/accounts/deposits/deposit-form/deposit-form.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegistrationComponent } from './components/auth/registration/registration.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { PlanSelectionComponent } from './components/platform/onboarding/plan-selection/plan-selection.component';
import { PaymentComponent } from './components/platform/onboarding/payment/payment.component';
import { RenewSubscriptionComponent } from './components/platform/onboarding/renew-subscription/renew-subscription.component';
import { TenantActivationComponent } from './components/platform/onboarding/tenant-activation/tenant-activation.component';
import { CompanySelectionComponent } from './components/platform/onboarding/company-selection/company-selection.component';
import { ShellComponent } from './components/shared/shell/shell.component';
import { CarCardComponent } from './components/setup/car/car-card/car-card.component';
import { CarListComponent } from './components/setup/car/car-list/car-list.component';
import { CarGridListComponent } from './components/setup/car/car-grid-list/car-grid-list.component';
import { BranchListComponent } from './components/branches/branch-list/branch-list.component';
import { BranchFormComponent } from './components/branches/branch-form/branch-form.component';
import { CompanyListComponent } from './components/companies/company-list/company-list.component';
import { CompanyFormComponent } from './components/companies/company-form/company-form.component';
import { StoreListComponent } from './components/stores/store-list/store-list.component';
import { StoreFormComponent } from './components/stores/store-form/store-form.component';
import { ChartOfAccountsComponent } from './components/accounting/chart-of-accounts/chart-of-accounts.component';
import { JournalEntriesComponent } from './components/accounting/journal-entries/journal-entries.component';
import { JournalEntriesListComponent } from './components/accounting/journal-entries-list/journal-entries-list.component';
import { ChartOfAccountsTreeComponent } from './components/accounting/chart-of-accounts-tree/chart-of-accounts-tree.component';
import { CostCenterListComponent } from './components/setup/cost-center/cost-center-list/cost-center-list.component';
import { CostCenterFormComponent } from './components/setup/cost-center/cost-center-form/cost-center-form.component';
import { CostPriceCalculationSettingsComponent } from './components/setup/cost-price-calculation/cost-price-calculation-settings.component';
import { DocumentNumberingSettingsComponent } from './components/setup/document-numbering-settings/document-numbering-settings.component';
import { DocumentLifecycleSettingsComponent } from './components/setup/document-lifecycle-settings/document-lifecycle-settings.component';
import { QrCodeSettingsComponent } from './components/setup/qr-code-settings/qr-code-settings.component';
import { BankManagementListComponent } from './components/setup/banks/bank-list/bank-list.component';
import { BankManagementFormComponent } from './components/setup/banks/bank-form/bank-form.component';
import { OpeningBalancesInventoryListComponent } from './components/inventory/opening-balances-inventory-list/opening-balances-inventory-list.component';
import { OpeningBalancesInventoryFormComponent } from './components/inventory/opening-balances-inventory-form/opening-balances-inventory-form.component';
import { OpeningBalancesFinancialListComponent } from './components/accounting/opening-balances-financial/opening-balances-financial-list/opening-balances-financial-list.component';
import { OpeningBalancesFinancialFormComponent } from './components/accounting/opening-balances-financial/opening-balances-financial-form/opening-balances-financial-form.component';
import { SalesInvoiceCashComponent } from './components/sales/sales-invoice-form/sales-invoice-cash/sales-invoice-cash.component';
import { SalesInvoiceCreditComponent } from './components/sales/sales-invoice-form/sales-invoice-credit/sales-invoice-credit.component';
import { SalesInvoiceInstallmentComponent } from './components/sales/sales-invoice-form/sales-invoice-installment/sales-invoice-installment.component';
import { CashSaleListComponent } from './components/sales/sales-invoice-form/cash-sale-list/cash-sale-list.component';
import { CreditSaleListComponent } from './components/sales/sales-invoice-form/credit-sale-list/credit-sale-list.component';
import { InstallmentSaleListComponent } from './components/sales/sales-invoice-form/installment-sale-list/installment-sale-list.component';
import { CashInvoiceListComponent } from './components/sales/sales-invoice-list/cash-invoice-list/cash-invoice-list.component';
import { CreditInvoiceListComponent } from './components/sales/sales-invoice-list/credit-invoice-list/credit-invoice-list.component';
import { AccountBalanceComponent } from './components/reports/account-balance/account-balance.component';
import { AccountStatementComponent } from './components/reports/account-statement/account-statement.component';
import { BalanceSheetComponent } from './components/reports/balance-sheet/balance-sheet.component';
import { BusinessActivityComponent } from './components/reports/business-activity/business-activity.component';
import { GeneralJournalComponent } from './components/reports/general-journal/general-journal.component';
import { TrialBalanceComponent } from './components/reports/trial-balance/trial-balance.component';
import { CarCategoryListComponent } from './components/setup/car-category/car-category-list/car-category-list.component';
import { CarCategoryFormComponent } from './components/setup/car-category/car-category-form/car-category-form.component';
import { ApprovalWorkflowListComponent } from './components/approvals/approval-workflow-list/approval-workflow-list.component';
import { ApprovalWorkflowFormComponent } from './components/approvals/approval-workflow-form/approval-workflow-form.component';
import { PendingApprovalsComponent } from './components/approvals/pending-approvals/pending-approvals.component';
import { ManagerApprovalComponent } from './components/approvals/manager-approval/manager-approval.component';
import { PurchaseOffersComponent } from './components/purchases/purchase-offers/purchase-offers.component';
import { PurchaseOfferFormComponent } from './components/purchases/purchase-offer-form/purchase-offer-form.component';
import { QuotationsComponent } from './components/sales/quotations/quotations.component';
import { QuotationFormComponent } from './components/sales/quotation-form/quotation-form.component';
import { CustomerOrderFormComponent } from './components/sales/customer-order-form/customer-order-form.component';
import { BankSalesOrderComponent } from './components/sales/bank-financing/bank-sales-order/bank-sales-order.component';
import { PreparationManagementComponent } from './components/sales/preparation-management/preparation-management.component';
import { BankInvoiceFormComponent } from './components/sales/bank-invoice-form/bank-invoice-form.component';
import { CompaniesInvoiceFormComponent } from './components/sales/companies-invoice-form/companies-invoice-form.component';
import { PurchaseRequestListComponent } from './components/purchases/purchase-request-list/purchase-request-list.component';
import { PurchaseRequestFormComponent } from './components/purchases/purchase-request-form/purchase-request-form.component';
import { PurchaseOrderListComponent } from './components/purchases/purchase-order-list/purchase-order-list.component';
import { PurchaseOrderFormComponent } from './components/purchases/purchase-order-form/purchase-order-form.component';
import { SupplierRfqListComponent } from './components/purchases/supplier-rfq-list/supplier-rfq-list.component';
import { SupplierRfqFormComponent } from './components/purchases/supplier-rfq-form/supplier-rfq-form.component';
import { PurchaseRequisitionListComponent } from './components/purchases/purchase-requisition-list/purchase-requisition-list.component';
import { PurchaseRequisitionFormComponent } from './components/purchases/purchase-requisition-form/purchase-requisition-form.component';
import { PurchaseRequisitionViewComponent } from './components/purchases/purchase-requisition-view/purchase-requisition-view.component';
import { PurchaseRequisitionApprovalListComponent } from './components/purchases/purchase-requisition-approval-list/purchase-requisition-approval-list.component';
import { CarsReceiptNoteListComponent } from './components/purchases/cars-receipt-note-list/cars-receipt-note-list.component';
import { CarsReceiptNoteFormComponent } from './components/purchases/cars-receipt-note-form/cars-receipt-note-form.component';
import { BankQuotationContainerComponent } from './components/sales/bank-financing/bank-quotation-container/bank-quotation-container.component';
import { BankApprovalManagerComponent } from './components/sales/bank-financing/bank-approval-manager/bank-approval-manager.component';
import { CorporateQuotationContainerComponent } from './components/sales/corporate/corporate-quotation-container/corporate-quotation-container.component';
import { CorporateOrderManagerComponent } from './components/sales/corporate/corporate-order-manager/corporate-order-manager.component';
import { CorporateOrderListComponent } from './components/sales/corporate/corporate-order-list/corporate-order-list.component';
import { CorporateOrderViewComponent } from './components/sales/corporate/corporate-order-view/corporate-order-view.component';
import { CorporateFleetDispatcherComponent } from './components/sales/corporate/corporate-fleet-dispatcher/corporate-fleet-dispatcher.component';
import { CorporateDeliveryListComponent } from './components/sales/corporate/corporate-delivery-list/corporate-delivery-list.component';
import { CorporateDeliveryViewComponent } from './components/sales/corporate/corporate-delivery-view/corporate-delivery-view.component';
import { CorporateQuotationListComponent } from './components/sales/corporate/corporate-quotation-list/corporate-quotation-list.component';
import { CorporateInvoiceListComponent } from './components/sales/corporate/corporate-invoice-list/corporate-invoice-list.component';
import { CorporateReceiptListComponent } from './components/sales/corporate/corporate-receipt-list/corporate-receipt-list.component';
import { BankApprovalListComponent } from './components/sales/bank-financing/bank-approval-list/bank-approval-list.component';
import { BankApprovalViewComponent } from './components/sales/bank-financing/bank-approval-view/bank-approval-view.component';
import { BankOrderListComponent } from './components/sales/bank-financing/bank-order-list/bank-order-list.component';
import { BankQuotationListComponent } from './components/sales/bank-financing/bank-quotation-list/bank-quotation-list.component';
import { BankInvoiceListComponent } from './components/sales/bank-financing/bank-invoice-list/bank-invoice-list.component';
import { BankCollectionListComponent } from './components/sales/bank-financing/bank-collection-list/bank-collection-list.component';
import { BankVehicleDeliveryFormComponent } from './components/sales/bank-financing/bank-vehicle-delivery-form/bank-vehicle-delivery-form.component';
import { BankVehicleDeliveryListComponent } from './components/sales/bank-financing/bank-vehicle-delivery-list/bank-vehicle-delivery-list.component';
import { BankVehicleDeliveryViewComponent } from './components/sales/bank-financing/bank-vehicle-delivery-view/bank-vehicle-delivery-view.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // guestGuard bounces an already-signed-in user who's fully onboarded away from these two --
  // landing back on the signup/login form after you already have a working session is confusing.
  // A signed-in-but-not-yet-onboarded user is instead sent wherever they actually belong.
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'registration', component: RegistrationComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard] },
  // Onboarding steps are bare pages like login/registration (no sidebar/toolbar) since the
  // visiting tenant may not have a usable subscription yet -- see subscriptionGuard/tenantGuard,
  // which redirect a signed-in user here based on their current tenant/subscription status.
  { path: 'onboarding/plans', component: PlanSelectionComponent },
  { path: 'onboarding/payment', component: PaymentComponent },
  { path: 'onboarding/renew', component: RenewSubscriptionComponent },
  { path: 'tenant-activation', component: TenantActivationComponent },
  // Bare page like the above -- reached via companySelectedGuard when the caller belongs to more
  // than one company. Not itself guarded (the guard that sends you here would just send you right
  // back).
  { path: 'select-company', component: CompanySelectionComponent },
  // Print routes are deliberately siblings of `login`/`registration`, NOT children of
  // LayoutComponent. They render as bare, chrome-free pages (no sidebar/toolbar/menu) so
  // `window.print()` only ever rasterizes the invoice document itself.
  { path: 'sales/invoice/print/:id', component: PrintableSalesInvoiceComponent },
  { path: 'purchases/invoice/print/:id', component: PrintablePurchaseInvoiceComponent },
  // Must come before the '' + children block below: that block's own wildcard ('**') child would
  // otherwise swallow /platform/* first, since Angular tries top-level routes in array order and
  // '' matches (as an empty prefix) before 'platform' is ever considered. Kept as its own
  // LayoutComponent instance (rather than nested inside the '' block's children, as it used to
  // be) specifically so it is NOT covered by that block's canActivate: [subscriptionGuard] --
  // /platform/* is the internal super-admin console, gated only by platform.routes.ts' own
  // authGuard, not by whether the caller's tenant has a subscription.
  {
    path: 'platform',
    component: ShellComponent,
    loadChildren: () => import('./components/platform/platform.routes').then(m => m.PLATFORM_ROUTES)
  },
  {
    path: '',
    component: ShellComponent,
    // Order matters: Angular runs canActivate guards in array order and short-circuits on the
    // first redirect. companySelectedGuard runs first so that by the time tenantGuard/
    // subscriptionGuard run, either a company is already selected (JWT tenantId claim correct) or
    // the caller has already been sent to /select-company -- neither of those two needs any code
    // change for multi-company support as a result. Then a suspended tenant / deactivated user
    // (tenantGuard) is turned away before subscriptionGuard's own status lookup even fires.
    canActivate: [companySelectedGuard, tenantGuard, subscriptionGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'setup/manufacturers', component: ManufacturersComponent },
      { path: 'setup/models', component: CarModelsComponent },
      { path: 'setup/car-categories', component: CarCategoryListComponent },
      { path: 'setup/car-categories/new', component: CarCategoryFormComponent },
      { path: 'setup/car-categories/edit/:id', component: CarCategoryFormComponent },
      { path: 'setup/year', component: ManufactureYearComponent },
      { path: 'setup/car-card', component :CarCardComponent },
      { path: 'setup/cars', component :CarListComponent },
      { path: 'setup/cars-grid', component :CarGridListComponent },
      { path: 'setup/branches', component: BranchListComponent },
      { path: 'setup/branches/new', component: BranchFormComponent },
      { path: 'setup/branches/edit/:id', component: BranchFormComponent },
      { path: 'setup/companies', component: CompanyListComponent },
      { path: 'setup/companies/new', component: CompanyFormComponent },
      { path: 'setup/companies/edit/:id', component: CompanyFormComponent },
      { path: 'setup/stores', component: StoreListComponent },
      { path: 'setup/stores/new', component: StoreFormComponent },
      { path: 'setup/stores/edit/:id', component: StoreFormComponent },
      { path: 'cost-centers', component: CostCenterListComponent },
      { path: 'cost-centers/new', component: CostCenterFormComponent },
      { path: 'cost-centers/edit/:id', component: CostCenterFormComponent },
      { path: 'setup/cost-price-settings', component: CostPriceCalculationSettingsComponent },
      { path: 'setup/document-numbering-settings', component: DocumentNumberingSettingsComponent },
      { path: 'setup/document-lifecycle-settings', component: DocumentLifecycleSettingsComponent },
      { path: 'setup/qr-code-settings', component: QrCodeSettingsComponent },
      // Redirect to the functional inventory form
      { path: 'inventory', component: InventoryListComponent },
  { path: 'inventory/opening-balances', component: OpeningBalancesInventoryListComponent },
  { path: 'inventory/opening-balances/new', component: OpeningBalancesInventoryFormComponent },
  { path: 'inventory/opening-balances/edit/:id', component: OpeningBalancesInventoryFormComponent },
  { path: 'inventory/new', component: InventoryFormComponent },
  { path: 'inventory/edit/:id', component: InventoryFormComponent },
  { path: 'inventory/stock-taking', component: StockTakingComponent },
  { path: 'inventory/stock-taking/new', component: StockTakingFormComponent },
  { path: 'inventory/stock-taking/edit/:id', component: StockTakingFormComponent },
  { path: 'inventory/stock-taking-approval', component: StockTakingApprovalComponent },
  { path: 'inventory/stock-taking-approval/new', component: StockTakingApprovalFormComponent },
  { path: 'inventory/stock-taking-approval/edit/:id', component: StockTakingApprovalFormComponent },
  { path: 'requested-cars', component: RequestedCarsComponent },
  { path: 'requested-cars/new', component: RequestedCarFormComponent },
  { path: 'requested-cars/edit/:id', component: RequestedCarFormComponent },
  { path: 'consignment-cars', component: ConsignmentListComponent },
  { path: 'consignment-cars/new', component: ConsignmentFormComponent },
  { path: 'consignment-cars/edit/:id', component: ConsignmentFormComponent },
  { path: 'daily-entries', component: DailyEntriesListComponent },
  { path: 'daily-entries/new', component: DailyEntryFormComponent },
  { path: 'daily-entries/:id/edit', component: DailyEntryFormComponent },
  { path: 'sales/invoice-credit-list', component: InvoiceCreditListComponent },
  { path: 'sales/quotations', component: QuotationsComponent },
  { path: 'sales/quotations/new', component: QuotationFormComponent },
  { path: 'sales/quotations/edit/:id', component: QuotationFormComponent },
  { path: 'sales/customer-orders/new', component: CustomerOrderFormComponent },
  // Direct Sales — single-step invoice entry points, parametrized on SalesInvoiceFormComponent
  { path: 'sales/direct/cash-sale', component: CashSaleListComponent },
  { path: 'sales/direct/cash-sale/new', component: SalesInvoiceCashComponent },
  { path: 'sales/direct/cash-sale/edit/:id', component: SalesInvoiceCashComponent },
  { path: 'sales/direct/credit-sale', component: CreditSaleListComponent },
  { path: 'sales/direct/credit-sale/new', component: SalesInvoiceCreditComponent },
  { path: 'sales/direct/credit-sale/edit/:id', component: SalesInvoiceCreditComponent },
  { path: 'sales/direct/installment-sale', component: InstallmentSaleListComponent },
  { path: 'sales/direct/installment-sale/new', component: SalesInvoiceInstallmentComponent },
  { path: 'sales/direct/installment-sale/edit/:id', component: SalesInvoiceInstallmentComponent },
  // Corporate Sales — 5-step ERP workflow
  { path: 'sales/corporate/quotations', component: CorporateQuotationListComponent },
  { path: 'sales/corporate/quotations/new', component: CorporateQuotationContainerComponent },
  { path: 'sales/corporate/orders', component: CorporateOrderListComponent },
  { path: 'sales/corporate/orders/new', component: CorporateOrderManagerComponent },
  { path: 'sales/corporate/orders/view/:id', component: CorporateOrderViewComponent },
  { path: 'sales/corporate/deliveries', component: CorporateDeliveryListComponent },
  { path: 'sales/corporate/deliveries/new', component: CorporateFleetDispatcherComponent },
  { path: 'sales/corporate/deliveries/view/:id', component: CorporateDeliveryViewComponent },
  { path: 'sales/corporate/invoices', component: CorporateInvoiceListComponent },
  { path: 'sales/corporate/invoices/new', component: CompaniesInvoiceFormComponent },
  { path: 'sales/corporate/invoices/edit/:id', component: CompaniesInvoiceFormComponent },
  { path: 'sales/corporate/receipts', component: CorporateReceiptListComponent },
  { path: 'sales/corporate/receipts/new', component: ReceiptFormComponent },
  // Bank Sales — 6-step vehicle financing workflow
  { path: 'sales/bank/quotations', component: BankQuotationListComponent },
  { path: 'sales/bank/quotations/new', component: BankQuotationContainerComponent },
  { path: 'sales/bank/approvals', component: BankApprovalListComponent },
  { path: 'sales/bank/approvals/new', component: BankApprovalManagerComponent },
  { path: 'sales/bank/approvals/view/:id', component: BankApprovalViewComponent },
  { path: 'sales/bank/orders', component: BankOrderListComponent },
  { path: 'sales/bank/orders/new', component: BankSalesOrderComponent },
  { path: 'sales/bank/orders/view/:id', component: BankSalesOrderComponent },
  { path: 'sales/bank/deliveries', component: BankVehicleDeliveryListComponent },
  { path: 'sales/bank/deliveries/new', component: BankVehicleDeliveryFormComponent },
  { path: 'sales/bank/deliveries/view/:id', component: BankVehicleDeliveryViewComponent },
  { path: 'sales/bank/invoices', component: BankInvoiceListComponent },
  { path: 'sales/bank/invoices/new', component: BankInvoiceFormComponent },
  { path: 'sales/bank/invoices/edit/:id', component: BankInvoiceFormComponent },
  { path: 'sales/bank/collections', component: BankCollectionListComponent },
  { path: 'sales/bank/collections/new', component: ReceiptFormComponent },
  { path: 'sales/preparation/:vehicleId', component: PreparationManagementComponent },
  { path: 'sales/invoice/cash/new', component: SalesInvoiceCashComponent },
  { path: 'sales/invoice/cash/edit/:id', component: SalesInvoiceCashComponent },
  { path: 'sales/invoice/credit/new', component: SalesInvoiceCreditComponent },
  { path: 'sales/invoice/credit/edit/:id', component: SalesInvoiceCreditComponent },
  { path: 'sales/invoice/cash', component: CashInvoiceListComponent },
  { path: 'sales/invoice/credit', component: CreditInvoiceListComponent },
  { path: 'sales/return', component: SalesReturnInvoiceListComponent },
  { path: 'sales/returns', component: SalesReturnInvoiceListComponent }, // Added plural route
  { path: 'sales/cash/return/new', component: CashInvoiceFormComponent },
  { path: 'sales/cash/return/new/:id', component: CashInvoiceFormComponent },
  { path: 'sales/credit/return/new', component: CreditInvoiceFormComponent },
  { path: 'sales/credit/return/new/:id', component: CreditInvoiceFormComponent },
  { path: 'sales/return/cash/new', component: CashInvoiceFormComponent },
  { path: 'sales/return/credit/new', component: CreditInvoiceFormComponent },
  { path: 'sales/return/cash', component: SalesCashReturnInvoiceListComponent },
  { path: 'sales/return/credit', component: SalesCreditReturnInvoiceListComponent },
  { path: 'purchases', component: PurchasesComponent },
  { path: 'purchases/requests', component: PurchaseRequestListComponent },
  { path: 'purchases/requests/new', component: PurchaseRequestFormComponent },
  { path: 'purchases/requests/edit/:id', component: PurchaseRequestFormComponent },
  { path: 'purchases/offers', component: PurchaseOffersComponent },
  { path: 'purchases/offers/new', component: PurchaseOfferFormComponent },
  { path: 'purchases/offers/edit/:id', component: PurchaseOfferFormComponent },
  { path: 'purchases/orders', component: PurchaseOrderListComponent },
  { path: 'purchases/orders/new', component: PurchaseOrderFormComponent },
  { path: 'purchases/orders/edit/:id', component: PurchaseOrderFormComponent },
  { path: 'purchases/supplier-quotations', component: SupplierRfqListComponent },
  { path: 'purchases/supplier-quotations/new', component: SupplierRfqFormComponent },
  { path: 'purchases/supplier-quotations/edit/:id', component: SupplierRfqFormComponent },
  { path: 'purchases/requisitions', component: PurchaseRequisitionListComponent },
  { path: 'purchases/requisitions/new', component: PurchaseRequisitionFormComponent },
  { path: 'purchases/requisitions/edit/:id', component: PurchaseRequisitionFormComponent },
  { path: 'purchases/requisitions/view/:id', component: PurchaseRequisitionViewComponent },
  { path: 'purchases/requisition-approvals', component: PurchaseRequisitionApprovalListComponent },
  { path: 'purchases/receipt-notes', component: CarsReceiptNoteListComponent },
  { path: 'purchases/receipt-notes/new', component: CarsReceiptNoteFormComponent },
  { path: 'purchases/receipt-notes/view/:id', component: CarsReceiptNoteFormComponent },
  { path: 'purchases/invoice/cash', component: CashPurchaseInvoiceListComponent },
  { path: 'purchases/invoice/credit', component: CreditPurchaseInvoiceListComponent },
  { path: 'purchases/invoice/cash/new', component: PurchaseCashInvoiceComponent },
  { path: 'purchases/invoice/credit/new', component: PurchaseCreditInvoiceComponent },
  { path: 'purchases/invoice/new', component: PurchaseInvoiceComponent },
  { path: 'purchases/invoice/edit/:id', component: PurchaseInvoiceComponent },
  { path: 'purchases/return', component: PurchaseReturnInvoiceComponent },
  { path: 'purchases/returns', component: PurchaseReturnInvoiceComponent }, // Added plural route
  { path: 'purchases/return/new', component: PurchaseReturnFormComponent },
  { path: 'purchases/return/cash/new', component: CashPurchaseReturnComponent },
  { path: 'purchases/return/credit/new', component: CreditPurchaseReturnComponent },
  { path: 'purchases/return/cash', component: CashReturnInvoiceListComponent },
  { path: 'purchases/return/credit', component: CreditReturnInvoiceListComponent },
  { path: 'expenses', component: ExpensesComponent, canActivate: [permissionGuard('expenses.view')] },
  { path: 'expenses/new', component: ExpenseFormComponent, canActivate: [permissionGuard('expenses.view')] },
  { path: 'expenses/edit/:id', component: ExpenseFormComponent, canActivate: [permissionGuard('expenses.view')] },
  { path: 'accounts/receipts', component: ReceiptsComponent },
  { path: 'accounts/receipts/new', component: ReceiptFormComponent },
   { path: 'accounts/receipts/edit/:id', component: ReceiptFormComponent },
  { path: 'accounts/payments', component: PaymentsComponent },
  { path: 'accounts/payments/new', component: PaymentFormComponent },
  { path: 'accounts/payments/edit/:id', component: PaymentFormComponent },

  { path: 'accounts/deposits', component: DepositListComponent }, // New Deposit List
  { path: 'accounts/deposits/new', component: DepositFormComponent }, // New Deposit Form
  { path: 'accounts/deposits/new/:id', component: DepositFormComponent }, // New Deposit Form with pre-selected car
  { path: 'accounts/deposits/edit/:id', component: DepositFormComponent }, // Edit Deposit Form
  { path: 'accounts/floor-plan-financing', component: FloorPlanReportComponent },
  { path: 'accounts/chart-of-accounts', component: ChartOfAccountsTreeComponent },
  { path: 'accounts/chart-of-accounts-new', component: ChartOfAccountsComponent },
  { path: 'accounts/chart-of-accounts-new/:id', component: ChartOfAccountsComponent },
  { path: 'accounts/opening-balances-financial', component: OpeningBalancesFinancialListComponent },
  { path: 'accounts/opening-balances-financial/new', component: OpeningBalancesFinancialFormComponent },
  { path: 'accounts/opening-balances-financial/new/:id', component: OpeningBalancesFinancialFormComponent },
  { path: 'accounts/opening-balances-inventory', component: OpeningBalancesInventoryListComponent },
  { path: 'accounts/journal-entries', component: JournalEntriesComponent },
  { path: 'accounts/opening-balances', component: OpeningBalancesFinancialListComponent },
  { path: 'accounts/journal-entries/:id', component: JournalEntriesComponent },
  { path: 'accounts/journal-entries-list', component: JournalEntriesListComponent },
  {path: 'accounts/', component: SalesReturnInvoiceListComponent }, // Added route for sales returns approval
  { path: 'entities/customers', component: CustomersComponent },
  { path: 'entities/customers/new', component: CustomerFormComponent },
  { path: 'entities/customers/edit/:id', component: CustomerFormComponent },
  { path: 'entities/suppliers', component: SuppliersComponent },
  { path: 'entities/suppliers/new', component: SupplierFormComponent },
  { path: 'entities/suppliers/edit/:id', component: SupplierFormComponent },
  { path: 'entities/banks', component: BankManagementListComponent },
  { path: 'entities/banks/new', component: BankManagementFormComponent },
  { path: 'entities/banks/edit/:id', component: BankManagementFormComponent },
  { path: 'entities/banks/view/:id', component: BankManagementFormComponent },
  { path: 'reports/financial', component: FinancialReportsComponent },
  { path: 'reports/tax', component: TaxReportsComponent },
  { path: 'reports/administrative', component: AdministrativeReportsComponent },
  { path: 'reports/account-balance', component: AccountBalanceComponent },
  { path: 'reports/account-statement', component: AccountStatementComponent },
  { path: 'reports/balance-sheet', component: BalanceSheetComponent },
  { path: 'reports/business-activity', component: BusinessActivityComponent },
  { path: 'reports/general-journal', component: GeneralJournalComponent },
  { path: 'reports/trial-balance', component: TrialBalanceComponent },
  { path: 'users', component: UsersComponent, canActivate: [permissionGuard('users.view')] },
  { path: 'users/new', component: UserFormComponent, canActivate: [permissionGuard('users.create')] },
  { path: 'users/edit/:id', component: UserFormComponent, canActivate: [permissionGuard('users.edit')] },
  { path: 'users/roles', component: RolesComponent, canActivate: [permissionGuard('users.roles.view')] },
  { path: 'profile', component: UserProfileComponent },
  { path: 'test-drives', component: TestDrivesComponent },
  { path: 'test-drives/new', component: TestDriveFormComponent },
  { path: 'test-drives/edit/:id', component: TestDriveFormComponent },
  { path: 'maintenance', component: MaintenanceDashboardComponent, canActivate: [permissionGuard('maintenance.view')] },
  { path: 'maintenance/new', component: ServiceOrderFormComponent, canActivate: [permissionGuard('maintenance.view')] },
  { path: 'maintenance/edit/:id', component: ServiceOrderFormComponent, canActivate: [permissionGuard('maintenance.view')] },
  { path: 'deliveries', component: DeliveryScheduleComponent },
  { path: 'deliveries/new', component: DeliveryFormComponent },
  { path: 'deliveries/edit/:id', component: DeliveryFormComponent },
  { path: 'deliveries/schedule/:invoiceId', component: DeliveryFormComponent },
  { path: 'approvals/workflows', component: ApprovalWorkflowListComponent },
  { path: 'approvals/workflows/new', component: ApprovalWorkflowFormComponent },
  { path: 'approvals/workflows/edit/:id', component: ApprovalWorkflowFormComponent },
  { path: 'approvals/pending', component: PendingApprovalsComponent },
  { path: 'approvals/manager', component: ManagerApprovalComponent },
  {
    path: 'installments',
    loadChildren: () => import('./components/installment/installment.module').then(m => m.InstallmentModule)
  },
  {
    path: 'car-management/reports',
    loadChildren: () => import('./components/car-management/reports/car-reports.routes').then(m => m.CAR_REPORTS_ROUTES)
  },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: '/dashboard' }
    ]
  }
];
