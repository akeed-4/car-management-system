
import { Routes } from '@angular/router';
import { permissionGuard } from './guards/permission.guard';
import { subscriptionGuard } from './guards/subscription.guard';
import { tenantGuard } from './guards/tenant.guard';
import { guestGuard } from './guards/guest.guard';
import { companySelectedGuard } from './guards/company-selected.guard';
import { storeSelectedGuard } from './guards/store-selected.guard';
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
import { CurrencyListComponent } from './components/setup/currencies/currency-list/currency-list.component';
import { CurrencyFormComponent } from './components/setup/currencies/currency-form/currency-form.component';
import { ExchangeRateListComponent } from './components/setup/exchange-rates/exchange-rate-list/exchange-rate-list.component';
import { ExchangeRateFormComponent } from './components/setup/exchange-rates/exchange-rate-form/exchange-rate-form.component';
import { StoreAccountingConfigurationListComponent } from './components/setup/store-accounting-configurations/store-accounting-configuration-list/store-accounting-configuration-list.component';
import { StoreAccountingConfigurationFormComponent } from './components/setup/store-accounting-configurations/store-accounting-configuration-form/store-accounting-configuration-form.component';
import { InventoryClosingComponent } from './components/setup/inventory-closing/inventory-closing.component';
import { StoreTransferListComponent } from './components/setup/store-transfers/store-transfer-list/store-transfer-list.component';
import { StoreTransferFormComponent } from './components/setup/store-transfers/store-transfer-form/store-transfer-form.component';
import { CarModelsComponent } from './components/setup/car-models/car-models-list/car-models.component';
import { ManufactureYearComponent } from './components/setup/manufacture-year/manufacture-year-list/manufacture-year.component';
import { CustomerFormComponent } from './components/entities/customers/customer-form/customer-form.component';
import { SupplierFormComponent } from './components/entities/suppliers/supplier-form/supplier-form.component';
import { SalesReturnInvoiceListComponent } from './components/sales/sales-return-invoice-list/sales-return-invoice-list/sales-return-invoice-list.component';
import { PurchaseReturnInvoiceComponent } from './components/purchases/purchase-return-invoice/purchase-return-invoice.component';
import { InvoicePrintComponent } from './components/shared/invoice-print/invoice-print.component';
import { PublicVehiclePageComponent } from './components/public/public-vehicle-page/public-vehicle-page.component';
import { VehicleLabelPrintComponent } from './components/shared/vehicle-label-print/vehicle-label-print.component';
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
import { UserPermissionsComponent } from './components/users/user-permissions/user-permissions.component';
import { RequestedCarsComponent } from './components/requested-cars/requested-cars-list/requested-cars.component';
import { RequestedCarFormComponent } from './components/requested-cars/requested-car-form/requested-car-form.component';
import { ExpensesComponent } from './components/expenses/expenses-list/expenses.component';
import { ExpenseFormComponent } from './components/expenses/expense-form/expense-form.component';
import { ReceiptsComponent } from './components/accounts/receipts/receipts.component';
import { ReceiptFormComponent } from './components/accounts/receipt-form/receipt-form.component';
import { ReceiptVoucherComponent } from './components/accounts/receipt-voucher/receipt-voucher.component';
import { PaymentsComponent } from './components/accounts/payments/payments.component';
import { PaymentFormComponent } from './components/accounts/payment-form/payment-form.component';
import { CarPaymentVoucherComponent } from './components/accounts/car-payment-voucher/car-payment-voucher.component';
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
import { StoreSelectionComponent } from './components/platform/onboarding/store-selection/store-selection.component';
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
import { YearSpecificationListComponent } from './components/setup/year-specifications/year-specification-list/year-specification-list.component';
import { YearSpecificationFormComponent } from './components/setup/year-specifications/year-specification-form/year-specification-form.component';
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
  // Same pattern one level down: reached via storeSelectedGuard when the caller has 2+ selectable
  // stores (Store is the user-facing "Showroom" concept -- Branch is resolved silently underneath
  // and never gets its own picker). Not itself guarded, same reason as select-company above.
  { path: 'select-store', component: StoreSelectionComponent },
  // Print routes are deliberately siblings of `login`/`registration`, NOT children of
  // LayoutComponent. They render as bare, chrome-free pages (no sidebar/toolbar/menu) so
  // `window.print()` only ever rasterizes the invoice document itself.
  // Invoice printing — one unified professional print component for all three
  // invoice types (see components/shared/invoice-print). The legacy
  // /sales/invoice/print/:id and /purchases/invoice/print/:id URLs are kept
  // verbatim so existing window.open() callers in the sales/purchase grids
  // keep working unchanged; ?copy=true forces the COPY watermark.
  { path: 'sales/invoice/print/:id', component: InvoicePrintComponent, data: { invoiceType: 'sales' } },
  { path: 'purchases/invoice/print/:id', component: InvoicePrintComponent, data: { invoiceType: 'purchase' } },
  { path: 'service/invoice/print/:id', component: InvoicePrintComponent, data: { invoiceType: 'service' } },
  { path: 'invoices/print/:type/:id', component: InvoicePrintComponent },
  // Anonymous public vehicle page reached by scanning a vehicle's QR code -- bare page like the
  // print routes above, no LayoutComponent shell, no auth guard. Backend: PublicVehiclesController.
  { path: 'v/:publicId', component: PublicVehiclePageComponent },
  { path: 'inventory/label/print/:id', component: VehicleLabelPrintComponent },
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
    // storeSelectedGuard runs last, after a tenant (and therefore the correct ERP database) is
    // already resolved, since Store/Branch rows live in that per-tenant database.
    canActivate: [companySelectedGuard, tenantGuard, subscriptionGuard, storeSelectedGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'setup/manufacturers', component: ManufacturersComponent, canActivate: [permissionGuard('setup.manufacturers.view')] },
      { path: 'setup/models', component: CarModelsComponent, canActivate: [permissionGuard('setup.models.view')] },
      { path: 'setup/car-categories', component: CarCategoryListComponent, canActivate: [permissionGuard('setup.carcategories.view')] },
      { path: 'setup/car-categories/new', component: CarCategoryFormComponent, canActivate: [permissionGuard('setup.carcategories.view')] },
      { path: 'setup/car-categories/edit/:id', component: CarCategoryFormComponent, canActivate: [permissionGuard('setup.carcategories.view')] },
      // Year Specification and Manufacture Year are two distinct screens sharing the one
      // "setup.manufactureyear.view" key in the catalog (no separate key exists for each).
      { path: 'setup/year-specifications', component: YearSpecificationListComponent, canActivate: [permissionGuard('setup.manufactureyear.view')] },
      { path: 'setup/year-specifications/new', component: YearSpecificationFormComponent, canActivate: [permissionGuard('setup.manufactureyear.view')] },
      { path: 'setup/year-specifications/edit/:id', component: YearSpecificationFormComponent, canActivate: [permissionGuard('setup.manufactureyear.view')] },
      { path: 'setup/year', component: ManufactureYearComponent, canActivate: [permissionGuard('setup.manufactureyear.view')] },
      { path: 'setup/car-card', component :CarCardComponent, canActivate: [permissionGuard('setup.carcard.view')] },
      { path: 'setup/cars', component :CarListComponent, canActivate: [permissionGuard('setup.cars.view')] },
      { path: 'setup/cars-grid', component :CarGridListComponent, canActivate: [permissionGuard('setup.cars.view')] },
      { path: 'setup/branches', component: BranchListComponent, canActivate: [permissionGuard('branches.view')] },
      { path: 'setup/branches/new', component: BranchFormComponent, canActivate: [permissionGuard('branches.view')] },
      { path: 'setup/branches/edit/:id', component: BranchFormComponent, canActivate: [permissionGuard('branches.view')] },
      { path: 'setup/companies', component: CompanyListComponent, canActivate: [permissionGuard('companies.view')] },
      { path: 'setup/companies/new', component: CompanyFormComponent, canActivate: [permissionGuard('companies.view')] },
      { path: 'setup/companies/edit/:id', component: CompanyFormComponent, canActivate: [permissionGuard('companies.view')] },
      { path: 'setup/stores', component: StoreListComponent, canActivate: [permissionGuard('stores.view')] },
      { path: 'setup/stores/new', component: StoreFormComponent, canActivate: [permissionGuard('stores.view')] },
      { path: 'setup/stores/edit/:id', component: StoreFormComponent, canActivate: [permissionGuard('stores.view')] },
      { path: 'cost-centers', component: CostCenterListComponent, canActivate: [permissionGuard('costcenters.view')] },
      { path: 'cost-centers/new', component: CostCenterFormComponent, canActivate: [permissionGuard('costcenters.view')] },
      { path: 'cost-centers/edit/:id', component: CostCenterFormComponent, canActivate: [permissionGuard('costcenters.view')] },
      { path: 'setup/currencies', component: CurrencyListComponent, canActivate: [permissionGuard('currencies.view')] },
      { path: 'setup/currencies/new', component: CurrencyFormComponent, canActivate: [permissionGuard('currencies.view')] },
      { path: 'setup/currencies/edit/:id', component: CurrencyFormComponent, canActivate: [permissionGuard('currencies.view')] },
      { path: 'setup/exchange-rates', component: ExchangeRateListComponent, canActivate: [permissionGuard('exchangerates.view')] },
      { path: 'setup/exchange-rates/new', component: ExchangeRateFormComponent, canActivate: [permissionGuard('exchangerates.view')] },
      { path: 'setup/exchange-rates/edit/:id', component: ExchangeRateFormComponent, canActivate: [permissionGuard('exchangerates.view')] },
      { path: 'setup/store-accounting-configurations', component: StoreAccountingConfigurationListComponent, canActivate: [permissionGuard('storeaccountingconfig.view')] },
      { path: 'setup/store-accounting-configurations/new', component: StoreAccountingConfigurationFormComponent, canActivate: [permissionGuard('storeaccountingconfig.view')] },
      { path: 'setup/store-accounting-configurations/edit/:id', component: StoreAccountingConfigurationFormComponent, canActivate: [permissionGuard('storeaccountingconfig.view')] },
      // No "inventory.closing.*" key exists in the catalog (distinct concept from
      // inventory.opening.view) -- left ungated rather than guessing.
      { path: 'setup/inventory-closing', component: InventoryClosingComponent },
      { path: 'setup/store-transfers', component: StoreTransferListComponent, canActivate: [permissionGuard('storetransfer.view')] },
      { path: 'setup/store-transfers/new', component: StoreTransferFormComponent, canActivate: [permissionGuard('storetransfer.view')] },
      { path: 'setup/cost-price-settings', component: CostPriceCalculationSettingsComponent, canActivate: [permissionGuard('settings.costprice.view')] },
      { path: 'setup/document-numbering-settings', component: DocumentNumberingSettingsComponent, canActivate: [permissionGuard('settings.documentnumbering.view')] },
      { path: 'setup/document-lifecycle-settings', component: DocumentLifecycleSettingsComponent, canActivate: [permissionGuard('settings.documentlifecycle.view')] },
      { path: 'setup/qr-code-settings', component: QrCodeSettingsComponent, canActivate: [permissionGuard('settings.qrcode.view')] },
      // Redirect to the functional inventory form
      { path: 'inventory', component: InventoryListComponent, canActivate: [permissionGuard('inventory.view')] },
  { path: 'inventory/opening-balances', component: OpeningBalancesInventoryListComponent, canActivate: [permissionGuard('inventory.opening.view')] },
  { path: 'inventory/opening-balances/new', component: OpeningBalancesInventoryFormComponent, canActivate: [permissionGuard('inventory.opening.view')] },
  { path: 'inventory/opening-balances/edit/:id', component: OpeningBalancesInventoryFormComponent, canActivate: [permissionGuard('inventory.opening.view')] },
  { path: 'inventory/new', component: InventoryFormComponent, canActivate: [permissionGuard('inventory.view')] },
  { path: 'inventory/edit/:id', component: InventoryFormComponent, canActivate: [permissionGuard('inventory.view')] },
  { path: 'inventory/stock-taking', component: StockTakingComponent, canActivate: [permissionGuard('inventory.stocktaking.view')] },
  { path: 'inventory/stock-taking/new', component: StockTakingFormComponent, canActivate: [permissionGuard('inventory.stocktaking.view')] },
  { path: 'inventory/stock-taking/edit/:id', component: StockTakingFormComponent, canActivate: [permissionGuard('inventory.stocktaking.view')] },
  { path: 'inventory/stock-taking-approval', component: StockTakingApprovalComponent, canActivate: [permissionGuard('inventory.approval.view')] },
  { path: 'inventory/stock-taking-approval/new', component: StockTakingApprovalFormComponent, canActivate: [permissionGuard('inventory.approval.view')] },
  { path: 'inventory/stock-taking-approval/edit/:id', component: StockTakingApprovalFormComponent, canActivate: [permissionGuard('inventory.approval.view')] },
  { path: 'requested-cars', component: RequestedCarsComponent, canActivate: [permissionGuard('cars.requested.view')] },
  { path: 'requested-cars/new', component: RequestedCarFormComponent, canActivate: [permissionGuard('cars.requested.view')] },
  { path: 'requested-cars/edit/:id', component: RequestedCarFormComponent, canActivate: [permissionGuard('cars.requested.view')] },
  { path: 'consignment-cars', component: ConsignmentListComponent, canActivate: [permissionGuard('cars.consignment.view')] },
  { path: 'consignment-cars/new', component: ConsignmentFormComponent, canActivate: [permissionGuard('cars.consignment.view')] },
  { path: 'consignment-cars/edit/:id', component: ConsignmentFormComponent, canActivate: [permissionGuard('cars.consignment.view')] },
  { path: 'daily-entries', component: DailyEntriesListComponent, canActivate: [permissionGuard('cars.daily.view')] },
  { path: 'daily-entries/new', component: DailyEntryFormComponent, canActivate: [permissionGuard('cars.daily.view')] },
  { path: 'daily-entries/:id/edit', component: DailyEntryFormComponent, canActivate: [permissionGuard('cars.daily.view')] },
  { path: 'sales/invoice-credit-list', component: InvoiceCreditListComponent, canActivate: [permissionGuard('sales.credit.view')] },
  { path: 'sales/quotations', component: QuotationsComponent, canActivate: [permissionGuard('sales.quotations.view')] },
  { path: 'sales/quotations/new', component: QuotationFormComponent, canActivate: [permissionGuard('sales.quotations.view')] },
  { path: 'sales/quotations/edit/:id', component: QuotationFormComponent, canActivate: [permissionGuard('sales.quotations.view')] },
  { path: 'sales/customer-orders/new', component: CustomerOrderFormComponent, canActivate: [permissionGuard('sales.quotations.view')] },
  // Direct Sales — single-step invoice entry points, parametrized on SalesInvoiceFormComponent
  { path: 'sales/direct/cash-sale', component: CashSaleListComponent, canActivate: [permissionGuard('sales.cash.view')] },
  { path: 'sales/direct/cash-sale/new', component: SalesInvoiceCashComponent, canActivate: [permissionGuard('sales.cash.view')] },
  { path: 'sales/direct/cash-sale/edit/:id', component: SalesInvoiceCashComponent, canActivate: [permissionGuard('sales.cash.view')] },
  { path: 'sales/direct/credit-sale', component: CreditSaleListComponent, canActivate: [permissionGuard('sales.credit.view')] },
  { path: 'sales/direct/credit-sale/new', component: SalesInvoiceCreditComponent, canActivate: [permissionGuard('sales.credit.view')] },
  { path: 'sales/direct/credit-sale/edit/:id', component: SalesInvoiceCreditComponent, canActivate: [permissionGuard('sales.credit.view')] },
  { path: 'sales/direct/installment-sale', component: InstallmentSaleListComponent, canActivate: [permissionGuard('sales.installments.view')] },
  { path: 'sales/direct/installment-sale/new', component: SalesInvoiceInstallmentComponent, canActivate: [permissionGuard('sales.installments.view')] },
  { path: 'sales/direct/installment-sale/edit/:id', component: SalesInvoiceInstallmentComponent, canActivate: [permissionGuard('sales.installments.view')] },
  // Corporate Sales — 5-step ERP workflow
  { path: 'sales/corporate/quotations', component: CorporateQuotationListComponent, canActivate: [permissionGuard('sales.corporate.quotations.view')] },
  { path: 'sales/corporate/quotations/new', component: CorporateQuotationContainerComponent, canActivate: [permissionGuard('sales.corporate.quotations.view')] },
  { path: 'sales/corporate/orders', component: CorporateOrderListComponent, canActivate: [permissionGuard('sales.corporate.orders.view')] },
  { path: 'sales/corporate/orders/new', component: CorporateOrderManagerComponent, canActivate: [permissionGuard('sales.corporate.orders.view')] },
  { path: 'sales/corporate/orders/view/:id', component: CorporateOrderViewComponent, canActivate: [permissionGuard('sales.corporate.orders.view')] },
  { path: 'sales/corporate/deliveries', component: CorporateDeliveryListComponent, canActivate: [permissionGuard('sales.corporate.deliveries.view')] },
  { path: 'sales/corporate/deliveries/new', component: CorporateFleetDispatcherComponent, canActivate: [permissionGuard('sales.corporate.deliveries.view')] },
  { path: 'sales/corporate/deliveries/view/:id', component: CorporateDeliveryViewComponent, canActivate: [permissionGuard('sales.corporate.deliveries.view')] },
  { path: 'sales/corporate/invoices', component: CorporateInvoiceListComponent, canActivate: [permissionGuard('sales.corporate.invoices.view')] },
  { path: 'sales/corporate/invoices/new', component: CompaniesInvoiceFormComponent, canActivate: [permissionGuard('sales.corporate.invoices.view')] },
  { path: 'sales/corporate/invoices/edit/:id', component: CompaniesInvoiceFormComponent, canActivate: [permissionGuard('sales.corporate.invoices.view')] },
  { path: 'sales/corporate/receipts', component: CorporateReceiptListComponent, canActivate: [permissionGuard('sales.corporate.receipts.view')] },
  { path: 'sales/corporate/receipts/new', component: ReceiptFormComponent, canActivate: [permissionGuard('sales.corporate.receipts.view')] },
  // Bank Sales — 6-step vehicle financing workflow
  { path: 'sales/bank/quotations', component: BankQuotationListComponent, canActivate: [permissionGuard('sales.bank.quotations.view')] },
  { path: 'sales/bank/quotations/new', component: BankQuotationContainerComponent, canActivate: [permissionGuard('sales.bank.quotations.view')] },
  { path: 'sales/bank/approvals', component: BankApprovalListComponent, canActivate: [permissionGuard('sales.bank.approvals.view')] },
  { path: 'sales/bank/approvals/new', component: BankApprovalManagerComponent, canActivate: [permissionGuard('sales.bank.approvals.view')] },
  { path: 'sales/bank/approvals/view/:id', component: BankApprovalViewComponent, canActivate: [permissionGuard('sales.bank.approvals.view')] },
  { path: 'sales/bank/orders', component: BankOrderListComponent, canActivate: [permissionGuard('sales.bank.orders.view')] },
  { path: 'sales/bank/orders/new', component: BankSalesOrderComponent, canActivate: [permissionGuard('sales.bank.orders.view')] },
  { path: 'sales/bank/orders/view/:id', component: BankSalesOrderComponent, canActivate: [permissionGuard('sales.bank.orders.view')] },
  { path: 'sales/bank/deliveries', component: BankVehicleDeliveryListComponent, canActivate: [permissionGuard('sales.bank.deliveries.view')] },
  { path: 'sales/bank/deliveries/new', component: BankVehicleDeliveryFormComponent, canActivate: [permissionGuard('sales.bank.deliveries.view')] },
  { path: 'sales/bank/deliveries/view/:id', component: BankVehicleDeliveryViewComponent, canActivate: [permissionGuard('sales.bank.deliveries.view')] },
  { path: 'sales/bank/invoices', component: BankInvoiceListComponent, canActivate: [permissionGuard('sales.bank.invoices.view')] },
  { path: 'sales/bank/invoices/new', component: BankInvoiceFormComponent, canActivate: [permissionGuard('sales.bank.invoices.view')] },
  { path: 'sales/bank/invoices/edit/:id', component: BankInvoiceFormComponent, canActivate: [permissionGuard('sales.bank.invoices.view')] },
  { path: 'sales/bank/collections', component: BankCollectionListComponent, canActivate: [permissionGuard('sales.bank.collections.view')] },
  { path: 'sales/bank/collections/new', component: ReceiptFormComponent, canActivate: [permissionGuard('sales.bank.collections.view')] },
  { path: 'sales/preparation/:vehicleId', component: PreparationManagementComponent, canActivate: [permissionGuard('sales.view')] },
  { path: 'sales/invoice/cash/new', component: SalesInvoiceCashComponent, canActivate: [permissionGuard('sales.cash.view')] },
  { path: 'sales/invoice/cash/edit/:id', component: SalesInvoiceCashComponent, canActivate: [permissionGuard('sales.cash.view')] },
  { path: 'sales/invoice/credit/new', component: SalesInvoiceCreditComponent, canActivate: [permissionGuard('sales.credit.view')] },
  { path: 'sales/invoice/credit/edit/:id', component: SalesInvoiceCreditComponent, canActivate: [permissionGuard('sales.credit.view')] },
  { path: 'sales/invoice/cash', component: CashInvoiceListComponent, canActivate: [permissionGuard('sales.cash.view')] },
  { path: 'sales/invoice/credit', component: CreditInvoiceListComponent, canActivate: [permissionGuard('sales.credit.view')] },
  // sales/return and sales/returns render BOTH cash and credit returns in one combined list
  // (SalesReturnInvoiceListComponent, isCashReturn defaults false) -- no single .view key covers
  // "either", so left ungated rather than guessing which one to require. The split routes below
  // (sales/return/cash, sales/return/credit) DO have an exact per-type key and are gated.
  { path: 'sales/return', component: SalesReturnInvoiceListComponent },
  { path: 'sales/returns', component: SalesReturnInvoiceListComponent }, // Added plural route
  { path: 'sales/cash/return/new', component: CashInvoiceFormComponent, canActivate: [permissionGuard('sales.returns.cash.view')] },
  { path: 'sales/cash/return/new/:id', component: CashInvoiceFormComponent, canActivate: [permissionGuard('sales.returns.cash.view')] },
  { path: 'sales/credit/return/new', component: CreditInvoiceFormComponent, canActivate: [permissionGuard('sales.returns.credit.view')] },
  { path: 'sales/credit/return/new/:id', component: CreditInvoiceFormComponent, canActivate: [permissionGuard('sales.returns.credit.view')] },
  { path: 'sales/return/cash/new', component: CashInvoiceFormComponent, canActivate: [permissionGuard('sales.returns.cash.view')] },
  { path: 'sales/return/credit/new', component: CreditInvoiceFormComponent, canActivate: [permissionGuard('sales.returns.credit.view')] },
  { path: 'sales/return/cash', component: SalesCashReturnInvoiceListComponent, canActivate: [permissionGuard('sales.returns.cash.view')] },
  { path: 'sales/return/credit', component: SalesCreditReturnInvoiceListComponent, canActivate: [permissionGuard('sales.returns.credit.view')] },
  { path: 'purchases', component: PurchasesComponent, canActivate: [permissionGuard('purchases.view')] },
  { path: 'purchases/requests', component: PurchaseRequestListComponent, canActivate: [permissionGuard('purchases.requisitions.view')] },
  { path: 'purchases/requests/new', component: PurchaseRequestFormComponent, canActivate: [permissionGuard('purchases.requisitions.view')] },
  { path: 'purchases/requests/edit/:id', component: PurchaseRequestFormComponent, canActivate: [permissionGuard('purchases.requisitions.view')] },
  { path: 'purchases/offers', component: PurchaseOffersComponent, canActivate: [permissionGuard('purchases.offers.view')] },
  { path: 'purchases/offers/new', component: PurchaseOfferFormComponent, canActivate: [permissionGuard('purchases.offers.view')] },
  { path: 'purchases/offers/edit/:id', component: PurchaseOfferFormComponent, canActivate: [permissionGuard('purchases.offers.view')] },
  { path: 'purchases/orders', component: PurchaseOrderListComponent, canActivate: [permissionGuard('purchases.orders.view')] },
  { path: 'purchases/orders/new', component: PurchaseOrderFormComponent, canActivate: [permissionGuard('purchases.orders.view')] },
  { path: 'purchases/orders/edit/:id', component: PurchaseOrderFormComponent, canActivate: [permissionGuard('purchases.orders.view')] },
  { path: 'purchases/supplier-quotations', component: SupplierRfqListComponent, canActivate: [permissionGuard('purchases.quotations.view')] },
  { path: 'purchases/supplier-quotations/new', component: SupplierRfqFormComponent, canActivate: [permissionGuard('purchases.quotations.view')] },
  { path: 'purchases/supplier-quotations/edit/:id', component: SupplierRfqFormComponent, canActivate: [permissionGuard('purchases.quotations.view')] },
  { path: 'purchases/requisitions', component: PurchaseRequisitionListComponent, canActivate: [permissionGuard('purchases.requisitions.view')] },
  { path: 'purchases/requisitions/new', component: PurchaseRequisitionFormComponent, canActivate: [permissionGuard('purchases.requisitions.view')] },
  { path: 'purchases/requisitions/edit/:id', component: PurchaseRequisitionFormComponent, canActivate: [permissionGuard('purchases.requisitions.view')] },
  { path: 'purchases/requisitions/view/:id', component: PurchaseRequisitionViewComponent, canActivate: [permissionGuard('purchases.requisitions.view')] },
  { path: 'purchases/requisition-approvals', component: PurchaseRequisitionApprovalListComponent, canActivate: [permissionGuard('purchases.requisitionapprovals.view')] },
  { path: 'purchases/receipt-notes', component: CarsReceiptNoteListComponent, canActivate: [permissionGuard('purchases.receipts.view')] },
  { path: 'purchases/receipt-notes/new', component: CarsReceiptNoteFormComponent, canActivate: [permissionGuard('purchases.receipts.view')] },
  { path: 'purchases/receipt-notes/view/:id', component: CarsReceiptNoteFormComponent, canActivate: [permissionGuard('purchases.receipts.view')] },
  { path: 'purchases/invoice/cash', component: CashPurchaseInvoiceListComponent, canActivate: [permissionGuard('purchases.cash.view')] },
  { path: 'purchases/invoice/credit', component: CreditPurchaseInvoiceListComponent, canActivate: [permissionGuard('purchases.credit.view')] },
  { path: 'purchases/invoice/cash/new', component: PurchaseCashInvoiceComponent, canActivate: [permissionGuard('purchases.cash.view')] },
  { path: 'purchases/invoice/credit/new', component: PurchaseCreditInvoiceComponent, canActivate: [permissionGuard('purchases.credit.view')] },
  // purchases/invoice/new and /edit/:id use the unlocked base PurchaseInvoiceComponent (not the
  // cash/credit-locked wrappers above) -- payment type is chosen inside the form, not fixed by
  // the route, so no single .view key applies; left ungated like the combined return lists below.
  { path: 'purchases/invoice/new', component: PurchaseInvoiceComponent },
  { path: 'purchases/invoice/edit/:id', component: PurchaseInvoiceComponent },
  // purchases/return and /returns render a combined (not cash/credit-split) view, same reasoning
  // as sales/return above -- left ungated; the split routes below ARE gated.
  { path: 'purchases/return', component: PurchaseReturnInvoiceComponent },
  { path: 'purchases/returns', component: PurchaseReturnInvoiceComponent }, // Added plural route
  { path: 'purchases/return/new', component: PurchaseReturnFormComponent },
  { path: 'purchases/return/cash/new', component: CashPurchaseReturnComponent, canActivate: [permissionGuard('purchases.returns.cash.view')] },
  { path: 'purchases/return/credit/new', component: CreditPurchaseReturnComponent, canActivate: [permissionGuard('purchases.returns.credit.view')] },
  { path: 'purchases/return/cash', component: CashReturnInvoiceListComponent, canActivate: [permissionGuard('purchases.returns.cash.view')] },
  { path: 'purchases/return/credit', component: CreditReturnInvoiceListComponent, canActivate: [permissionGuard('purchases.returns.credit.view')] },
  { path: 'expenses', component: ExpensesComponent, canActivate: [permissionGuard('expenses.view')] },
  { path: 'expenses/new', component: ExpenseFormComponent, canActivate: [permissionGuard('expenses.view')] },
  { path: 'expenses/edit/:id', component: ExpenseFormComponent, canActivate: [permissionGuard('expenses.view')] },
  { path: 'accounts/receipts', component: ReceiptsComponent, canActivate: [permissionGuard('receipts.view')] },
  { path: 'accounts/receipts/new', component: ReceiptFormComponent, canActivate: [permissionGuard('receipts.view')] },
   { path: 'accounts/receipts/edit/:id', component: ReceiptFormComponent, canActivate: [permissionGuard('receipts.view')] },
  { path: 'accounts/receipts/voucher', component: ReceiptVoucherComponent, canActivate: [permissionGuard('receipts.view')] },
  { path: 'accounts/payments', component: PaymentsComponent, canActivate: [permissionGuard('payments.view')] },
  { path: 'accounts/payments/new', component: PaymentFormComponent, canActivate: [permissionGuard('payments.view')] },
  { path: 'accounts/payments/edit/:id', component: PaymentFormComponent, canActivate: [permissionGuard('payments.view')] },
  { path: 'accounts/payments/car-voucher', component: CarPaymentVoucherComponent, canActivate: [permissionGuard('payments.view')] },

  { path: 'accounts/deposits', component: DepositListComponent, canActivate: [permissionGuard('deposits.view')] }, // New Deposit List
  { path: 'accounts/deposits/new', component: DepositFormComponent, canActivate: [permissionGuard('deposits.view')] }, // New Deposit Form
  { path: 'accounts/deposits/new/:id', component: DepositFormComponent, canActivate: [permissionGuard('deposits.view')] }, // New Deposit Form with pre-selected car
  { path: 'accounts/deposits/edit/:id', component: DepositFormComponent, canActivate: [permissionGuard('deposits.view')] }, // Edit Deposit Form
  { path: 'accounts/floor-plan-financing', component: FloorPlanReportComponent, canActivate: [permissionGuard('floorplan.view')] },
  { path: 'accounts/chart-of-accounts', component: ChartOfAccountsTreeComponent, canActivate: [permissionGuard('accounts.chart.view')] },
  { path: 'accounts/chart-of-accounts-new', component: ChartOfAccountsComponent, canActivate: [permissionGuard('accounts.chart.view')] },
  { path: 'accounts/chart-of-accounts-new/:id', component: ChartOfAccountsComponent, canActivate: [permissionGuard('accounts.chart.view')] },
  { path: 'accounts/opening-balances-financial', component: OpeningBalancesFinancialListComponent, canActivate: [permissionGuard('openingbalances.view')] },
  { path: 'accounts/opening-balances-financial/new', component: OpeningBalancesFinancialFormComponent, canActivate: [permissionGuard('openingbalances.view')] },
  { path: 'accounts/opening-balances-financial/new/:id', component: OpeningBalancesFinancialFormComponent, canActivate: [permissionGuard('openingbalances.view')] },
  { path: 'accounts/opening-balances-inventory', component: OpeningBalancesInventoryListComponent, canActivate: [permissionGuard('inventory.opening.view')] },
  { path: 'accounts/journal-entries', component: JournalEntriesComponent, canActivate: [permissionGuard('journalentries.view')] },
  { path: 'accounts/opening-balances', component: OpeningBalancesFinancialListComponent, canActivate: [permissionGuard('openingbalances.view')] },
  { path: 'accounts/journal-entries/:id', component: JournalEntriesComponent, canActivate: [permissionGuard('journalentries.view')] },
  { path: 'accounts/journal-entries-list', component: JournalEntriesListComponent, canActivate: [permissionGuard('journalentries.view')] },
  // Anomalous route: path is bare "accounts/" but renders SalesReturnInvoiceListComponent (a
  // Sales screen, not an Accounts one) -- looks like a mis-wired/leftover route rather than a
  // real screen. Left as-is (not gated, not removed) since fixing the routing itself is outside
  // this permission-wiring pass; flagging for separate review.
  {path: 'accounts/', component: SalesReturnInvoiceListComponent }, // Added route for sales returns approval
  { path: 'entities/customers', component: CustomersComponent, canActivate: [permissionGuard('customers.view')] },
  { path: 'entities/customers/new', component: CustomerFormComponent, canActivate: [permissionGuard('customers.view')] },
  { path: 'entities/customers/edit/:id', component: CustomerFormComponent, canActivate: [permissionGuard('customers.view')] },
  { path: 'entities/suppliers', component: SuppliersComponent, canActivate: [permissionGuard('suppliers.view')] },
  { path: 'entities/suppliers/new', component: SupplierFormComponent, canActivate: [permissionGuard('suppliers.view')] },
  { path: 'entities/suppliers/edit/:id', component: SupplierFormComponent, canActivate: [permissionGuard('suppliers.view')] },
  { path: 'entities/banks', component: BankManagementListComponent, canActivate: [permissionGuard('banks.view')] },
  { path: 'entities/banks/new', component: BankManagementFormComponent, canActivate: [permissionGuard('banks.view')] },
  { path: 'entities/banks/edit/:id', component: BankManagementFormComponent, canActivate: [permissionGuard('banks.view')] },
  { path: 'entities/banks/view/:id', component: BankManagementFormComponent, canActivate: [permissionGuard('banks.view')] },
  { path: 'reports/financial', component: FinancialReportsComponent, canActivate: [permissionGuard('reports.financial.view')] },
  // No reports.tax.*/reports.administrative.* keys exist in the catalog -- left ungated.
  { path: 'reports/tax', component: TaxReportsComponent },
  { path: 'reports/administrative', component: AdministrativeReportsComponent },
  // No routerLink/navigation anywhere in the app reaches these 6 -- appear to be orphaned routes,
  // and no dedicated permission key exists for any of them individually (reports.financial.view
  // is a plausible umbrella but not a clean name match) -- left ungated rather than guessing.
  { path: 'reports/account-balance', component: AccountBalanceComponent },
  { path: 'reports/account-statement', component: AccountStatementComponent },
  { path: 'reports/balance-sheet', component: BalanceSheetComponent },
  { path: 'reports/business-activity', component: BusinessActivityComponent },
  { path: 'reports/general-journal', component: GeneralJournalComponent },
  { path: 'reports/trial-balance', component: TrialBalanceComponent },
  { path: 'users', component: UsersComponent, canActivate: [permissionGuard('users.view')] },
  { path: 'users/new', component: UserFormComponent, canActivate: [permissionGuard('users.view')] },
  { path: 'users/edit/:id', component: UserFormComponent, canActivate: [permissionGuard('users.view')] },
  { path: 'users/roles', component: RolesComponent, canActivate: [permissionGuard('users.roles.view')] },
  // No dedicated users.permissions.view key exists -- users.roles.view ("View Roles & Permissions")
  // is the closest match and is also used by users/roles above (shared key, not a clean 1:1).
  { path: 'users/permissions', component: UserPermissionsComponent, canActivate: [permissionGuard('users.roles.view')] },
  { path: 'profile', component: UserProfileComponent },
  { path: 'test-drives', component: TestDrivesComponent },
  { path: 'test-drives/new', component: TestDriveFormComponent },
  { path: 'test-drives/edit/:id', component: TestDriveFormComponent },
  { path: 'maintenance', component: MaintenanceDashboardComponent, canActivate: [permissionGuard('maintenance.view')] },
  { path: 'maintenance/new', component: ServiceOrderFormComponent, canActivate: [permissionGuard('maintenance.view')] },
  { path: 'maintenance/edit/:id', component: ServiceOrderFormComponent, canActivate: [permissionGuard('maintenance.view')] },
  { path: 'deliveries', component: DeliveryScheduleComponent, canActivate: [permissionGuard('cars.delivery.view')] },
  { path: 'deliveries/new', component: DeliveryFormComponent, canActivate: [permissionGuard('cars.delivery.view')] },
  { path: 'deliveries/edit/:id', component: DeliveryFormComponent, canActivate: [permissionGuard('cars.delivery.view')] },
  { path: 'deliveries/schedule/:invoiceId', component: DeliveryFormComponent, canActivate: [permissionGuard('cars.delivery.view')] },
  { path: 'approvals/workflows', component: ApprovalWorkflowListComponent, canActivate: [permissionGuard('approvals.workflows.view')] },
  { path: 'approvals/workflows/new', component: ApprovalWorkflowFormComponent, canActivate: [permissionGuard('approvals.workflows.view')] },
  { path: 'approvals/workflows/edit/:id', component: ApprovalWorkflowFormComponent, canActivate: [permissionGuard('approvals.workflows.view')] },
  { path: 'approvals/pending', component: PendingApprovalsComponent, canActivate: [permissionGuard('approvals.pending.view')] },
  { path: 'approvals/manager', component: ManagerApprovalComponent, canActivate: [permissionGuard('approvals.manager.view')] },
  {
    path: 'installments',
    canActivate: [permissionGuard('sales.installments.view')],
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
