import { ReportColumnConfig, ReportConfig, ReportFilterFieldConfig } from './car-report.types';

const CAR_COLUMNS: ReportColumnConfig[] = [
  { dataField: 'vin', captionKey: 'CAR_REPORTS.COL.VIN', width: 160 },
  { dataField: 'make', captionKey: 'CAR_REPORTS.COL.BRAND', width: 120 },
  { dataField: 'model', captionKey: 'CAR_REPORTS.COL.MODEL', width: 120 },
  { dataField: 'year', captionKey: 'CAR_REPORTS.COL.YEAR', dataType: 'number', width: 90 },
  { dataField: 'exteriorColor', captionKey: 'CAR_REPORTS.COL.COLOR', width: 110 },
  { dataField: 'status', captionKey: 'CAR_REPORTS.COL.STATUS', width: 110 },
  { dataField: 'mileage', captionKey: 'CAR_REPORTS.COL.MILEAGE', dataType: 'number', width: 100 },
  { dataField: 'purchasePrice', captionKey: 'CAR_REPORTS.COL.PURCHASE_PRICE', dataType: 'currency', width: 130 },
  { dataField: 'salePrice', captionKey: 'CAR_REPORTS.COL.SALE_PRICE', dataType: 'currency', width: 130 },
  { dataField: 'totalCost', captionKey: 'CAR_REPORTS.COL.TOTAL_COST', dataType: 'currency', width: 130 },
];

const CONSIGNMENT_COLUMNS: ReportColumnConfig[] = [
  { dataField: 'consignmentNumber', captionKey: 'CAR_REPORTS.COL.CONSIGNMENT_NUMBER', width: 140 },
  { dataField: 'supplierName', captionKey: 'CAR_REPORTS.COL.SUPPLIER', width: 150 },
  { dataField: 'make', captionKey: 'CAR_REPORTS.COL.BRAND', width: 120 },
  { dataField: 'model', captionKey: 'CAR_REPORTS.COL.MODEL', width: 120 },
  { dataField: 'year', captionKey: 'CAR_REPORTS.COL.YEAR', dataType: 'number', width: 90 },
  { dataField: 'vin', captionKey: 'CAR_REPORTS.COL.VIN', width: 160 },
  { dataField: 'engineNumber', captionKey: 'CAR_REPORTS.COL.ENGINE_NUMBER', width: 140 },
  { dataField: 'status', captionKey: 'CAR_REPORTS.COL.STATUS', width: 110 },
  { dataField: 'arrivalDate', captionKey: 'CAR_REPORTS.COL.ARRIVAL_DATE', dataType: 'date', width: 120 },
  { dataField: 'currentCost', captionKey: 'CAR_REPORTS.COL.CURRENT_COST', dataType: 'currency', width: 130 },
  { dataField: 'expectedSalePrice', captionKey: 'CAR_REPORTS.COL.EXPECTED_SALE_PRICE', dataType: 'currency', width: 140 },
  { dataField: 'daysInStock', captionKey: 'CAR_REPORTS.COL.DAYS_IN_STOCK', dataType: 'number', width: 110 },
];

const REQUESTED_CAR_COLUMNS: ReportColumnConfig[] = [
  { dataField: 'requestNumber', captionKey: 'CAR_REPORTS.COL.REQUEST_NUMBER', width: 130 },
  { dataField: 'requestDate', captionKey: 'CAR_REPORTS.COL.REQUEST_DATE', dataType: 'date', width: 120 },
  { dataField: 'customerName', captionKey: 'CAR_REPORTS.COL.CUSTOMER', width: 150 },
  { dataField: 'make', captionKey: 'CAR_REPORTS.COL.BRAND', width: 120 },
  { dataField: 'model', captionKey: 'CAR_REPORTS.COL.MODEL', width: 120 },
  { dataField: 'year', captionKey: 'CAR_REPORTS.COL.YEAR', dataType: 'number', width: 90 },
  { dataField: 'color', captionKey: 'CAR_REPORTS.COL.COLOR', width: 110 },
  { dataField: 'priority', captionKey: 'CAR_REPORTS.COL.PRIORITY', width: 100 },
  { dataField: 'reservationStatus', captionKey: 'CAR_REPORTS.COL.RESERVATION_STATUS', width: 140 },
  { dataField: 'status', captionKey: 'CAR_REPORTS.COL.STATUS', width: 110 },
];

const DAILY_ENTRY_COLUMNS: ReportColumnConfig[] = [
  { dataField: 'referenceNumber', captionKey: 'CAR_REPORTS.COL.REFERENCE_NUMBER', width: 130 },
  { dataField: 'entryType', captionKey: 'CAR_REPORTS.COL.ENTRY_TYPE', width: 110 },
  { dataField: 'carDescription', captionKey: 'CAR_REPORTS.COL.CAR', width: 180 },
  { dataField: 'carVin', captionKey: 'CAR_REPORTS.COL.VIN', width: 160 },
  { dataField: 'storeName', captionKey: 'CAR_REPORTS.COL.WAREHOUSE', width: 140 },
  { dataField: 'employeeName', captionKey: 'CAR_REPORTS.COL.EMPLOYEE', width: 140 },
  { dataField: 'entryDate', captionKey: 'CAR_REPORTS.COL.ENTRY_DATE', dataType: 'date', width: 120 },
  { dataField: 'status', captionKey: 'CAR_REPORTS.COL.STATUS', width: 110 },
];

const DELIVERY_COLUMNS: ReportColumnConfig[] = [
  { dataField: 'deliveryNumber', captionKey: 'CAR_REPORTS.COL.DELIVERY_NUMBER', width: 140 },
  { dataField: 'customerName', captionKey: 'CAR_REPORTS.COL.CUSTOMER', width: 150 },
  { dataField: 'carDescription', captionKey: 'CAR_REPORTS.COL.CAR', width: 180 },
  { dataField: 'carVin', captionKey: 'CAR_REPORTS.COL.VIN', width: 160 },
  { dataField: 'branchName', captionKey: 'CAR_REPORTS.COL.BRANCH', width: 140 },
  { dataField: 'deliveryDate', captionKey: 'CAR_REPORTS.COL.DELIVERY_DATE', dataType: 'date', width: 120 },
  { dataField: 'status', captionKey: 'CAR_REPORTS.COL.STATUS', width: 110 },
  { dataField: 'deliveryProgress', captionKey: 'CAR_REPORTS.COL.PROGRESS', dataType: 'number', width: 100 },
];

const CAR_COST_COLUMNS: ReportColumnConfig[] = [
  ...CAR_COLUMNS,
  { dataField: 'additionalCosts', captionKey: 'CAR_REPORTS.COL.ADDITIONAL_COSTS', dataType: 'currency', width: 140 },
  { dataField: 'associatedCostsTotal', captionKey: 'CAR_REPORTS.COL.ASSOCIATED_EXPENSES', dataType: 'currency', width: 150 },
  { dataField: 'landedCost', captionKey: 'CAR_REPORTS.COL.LANDED_COST', dataType: 'currency', width: 130 },
];

const AGING_COLUMNS: ReportColumnConfig[] = [
  ...CAR_COLUMNS,
  { dataField: 'purchaseDate', captionKey: 'CAR_REPORTS.COL.PURCHASE_DATE', dataType: 'date', width: 120 },
  { dataField: 'daysInStock', captionKey: 'CAR_REPORTS.COL.DAYS_IN_STOCK', dataType: 'number', width: 110 },
];

const BY_SUPPLIER_COLUMNS: ReportColumnConfig[] = [
  { dataField: 'supplierName', captionKey: 'CAR_REPORTS.COL.SUPPLIER', width: 150 },
  { dataField: 'carDescription', captionKey: 'CAR_REPORTS.COL.CAR', width: 180 },
  { dataField: 'vin', captionKey: 'CAR_REPORTS.COL.VIN', width: 160 },
  { dataField: 'purchaseInvoiceNumber', captionKey: 'CAR_REPORTS.COL.PURCHASE_INVOICE_NUMBER', width: 150 },
  { dataField: 'purchaseDate', captionKey: 'CAR_REPORTS.COL.PURCHASE_DATE', dataType: 'date', width: 120 },
  { dataField: 'unitCost', captionKey: 'CAR_REPORTS.COL.UNIT_COST', dataType: 'currency', width: 130 },
];

const CAR_FILTERS: ReportFilterFieldConfig[] = [
  { key: 'brandId', labelKey: 'CAR_REPORTS.FILTER.BRAND', control: 'select', optionsSource: 'brands' },
  { key: 'modelId', labelKey: 'CAR_REPORTS.FILTER.MODEL', control: 'select', optionsSource: 'models' },
  { key: 'categoryId', labelKey: 'CAR_REPORTS.FILTER.CATEGORY', control: 'select', optionsSource: 'categories' },
  { key: 'color', labelKey: 'CAR_REPORTS.FILTER.COLOR', control: 'text' },
  { key: 'status', labelKey: 'CAR_REPORTS.FILTER.STATUS', control: 'select', optionsSource: 'carStatus' },
  { key: 'vin', labelKey: 'CAR_REPORTS.FILTER.VIN', control: 'text' },
  { key: 'year', labelKey: 'CAR_REPORTS.FILTER.YEAR', control: 'number' },
  { key: 'dateFrom', labelKey: 'CAR_REPORTS.FILTER.DATE_FROM', control: 'date' },
  { key: 'dateTo', labelKey: 'CAR_REPORTS.FILTER.DATE_TO', control: 'date' },
];

const CONSIGNMENT_FILTERS: ReportFilterFieldConfig[] = [
  { key: 'supplierId', labelKey: 'CAR_REPORTS.FILTER.SUPPLIER', control: 'select', optionsSource: 'suppliers' },
  { key: 'branchId', labelKey: 'CAR_REPORTS.FILTER.BRANCH', control: 'select', optionsSource: 'branches' },
  { key: 'status', labelKey: 'CAR_REPORTS.FILTER.STATUS', control: 'select', optionsSource: 'carStatus' },
  { key: 'vin', labelKey: 'CAR_REPORTS.FILTER.VIN', control: 'text' },
  { key: 'engineNumber', labelKey: 'CAR_REPORTS.FILTER.ENGINE_NUMBER', control: 'text' },
  { key: 'dateFrom', labelKey: 'CAR_REPORTS.FILTER.DATE_FROM', control: 'date' },
  { key: 'dateTo', labelKey: 'CAR_REPORTS.FILTER.DATE_TO', control: 'date' },
];

const DAILY_ENTRY_FILTERS: ReportFilterFieldConfig[] = [
  { key: 'warehouseId', labelKey: 'CAR_REPORTS.FILTER.WAREHOUSE', control: 'select', optionsSource: 'warehouses' },
  { key: 'status', labelKey: 'CAR_REPORTS.FILTER.STATUS', control: 'select', optionsSource: 'carStatus' },
  { key: 'dateFrom', labelKey: 'CAR_REPORTS.FILTER.DATE_FROM', control: 'date' },
  { key: 'dateTo', labelKey: 'CAR_REPORTS.FILTER.DATE_TO', control: 'date' },
];

const BY_BRANCH_FILTERS: ReportFilterFieldConfig[] = [
  { key: 'branchId', labelKey: 'CAR_REPORTS.FILTER.BRANCH', control: 'select', optionsSource: 'branches' },
  ...CAR_FILTERS,
];

const BY_WAREHOUSE_FILTERS: ReportFilterFieldConfig[] = [
  { key: 'warehouseId', labelKey: 'CAR_REPORTS.FILTER.WAREHOUSE', control: 'select', optionsSource: 'warehouses' },
  ...CAR_FILTERS,
];

const DELIVERY_FILTERS: ReportFilterFieldConfig[] = [
  { key: 'branchId', labelKey: 'CAR_REPORTS.FILTER.BRANCH', control: 'select', optionsSource: 'branches' },
  { key: 'status', labelKey: 'CAR_REPORTS.FILTER.STATUS', control: 'select', optionsSource: 'carStatus' },
  { key: 'dateFrom', labelKey: 'CAR_REPORTS.FILTER.DATE_FROM', control: 'date' },
  { key: 'dateTo', labelKey: 'CAR_REPORTS.FILTER.DATE_TO', control: 'date' },
];

/** dataSource keys map to CarReportsDataService methods / groupings consumed by the report screen components. */
export type CarReportDataSource =
  | 'cars-all'
  | 'cars-current-inventory'
  | 'cars-available'
  | 'cars-reserved'
  | 'cars-sold'
  | 'cars-delivered'
  | 'requested-cars'
  | 'consignment-cars'
  | 'daily-entries'
  | 'delivery-schedule'
  | 'cars-by-brand'
  | 'cars-by-model'
  | 'cars-by-year'
  | 'cars-by-color'
  | 'cars-by-vin'
  | 'cars-inventory-aging'
  | 'cars-inventory-valuation'
  | 'cars-cost'
  | 'cars-profitability'
  | 'cars-by-branch'
  | 'cars-by-warehouse'
  | 'cars-by-supplier'
  | 'cars-by-engine'
  | 'cars-movement'
  | 'cars-status';

export interface CarReportEntry extends ReportConfig {
  dataSource: CarReportDataSource;
}

export const CAR_REPORTS: CarReportEntry[] = [
  {
    key: 'cars',
    route: 'cars',
    dataSource: 'cars-all',
    titleKey: 'CAR_REPORTS.CARS.TITLE',
    subtitleKey: 'CAR_REPORTS.CARS.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.CARS.TITLE',
    permissionPrefix: 'reports.cars',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CarsReport',
  },
  {
    key: 'current-inventory',
    route: 'current-inventory',
    dataSource: 'cars-current-inventory',
    titleKey: 'CAR_REPORTS.CURRENT_INVENTORY.TITLE',
    subtitleKey: 'CAR_REPORTS.CURRENT_INVENTORY.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.CURRENT_INVENTORY.TITLE',
    permissionPrefix: 'reports.carsCurrentInventory',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CurrentInventoryReport',
  },
  {
    key: 'available',
    route: 'available',
    dataSource: 'cars-available',
    titleKey: 'CAR_REPORTS.AVAILABLE.TITLE',
    subtitleKey: 'CAR_REPORTS.AVAILABLE.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.AVAILABLE.TITLE',
    permissionPrefix: 'reports.carsAvailable',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'AvailableCarsReport',
  },
  {
    key: 'reserved',
    route: 'reserved',
    dataSource: 'cars-reserved',
    titleKey: 'CAR_REPORTS.RESERVED.TITLE',
    subtitleKey: 'CAR_REPORTS.RESERVED.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.RESERVED.TITLE',
    permissionPrefix: 'reports.carsReserved',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'ReservedCarsReport',
  },
  {
    key: 'sold',
    route: 'sold',
    dataSource: 'cars-sold',
    titleKey: 'CAR_REPORTS.SOLD.TITLE',
    subtitleKey: 'CAR_REPORTS.SOLD.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.SOLD.TITLE',
    permissionPrefix: 'reports.carsSold',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'SoldCarsReport',
    dataCaveatKey: 'CAR_REPORTS.CAVEAT.SOLD_UNION',
  },
  {
    key: 'delivered',
    route: 'delivered',
    dataSource: 'cars-delivered',
    titleKey: 'CAR_REPORTS.DELIVERED.TITLE',
    subtitleKey: 'CAR_REPORTS.DELIVERED.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.DELIVERED.TITLE',
    permissionPrefix: 'reports.carsDelivered',
    columns: DELIVERY_COLUMNS,
    filters: DELIVERY_FILTERS,
    exportFileName: 'DeliveredCarsReport',
  },
  {
    key: 'requested',
    route: 'requested',
    dataSource: 'requested-cars',
    titleKey: 'CAR_REPORTS.REQUESTED.TITLE',
    subtitleKey: 'CAR_REPORTS.REQUESTED.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.REQUESTED.TITLE',
    permissionPrefix: 'reports.carsRequested',
    columns: REQUESTED_CAR_COLUMNS,
    filters: CAR_FILTERS.filter(f => ['status', 'dateFrom', 'dateTo'].includes(f.key)),
    exportFileName: 'RequestedCarsReport',
  },
  {
    key: 'consignment',
    route: 'consignment',
    dataSource: 'consignment-cars',
    titleKey: 'CAR_REPORTS.CONSIGNMENT.TITLE',
    subtitleKey: 'CAR_REPORTS.CONSIGNMENT.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.CONSIGNMENT.TITLE',
    permissionPrefix: 'reports.carsConsignment',
    columns: CONSIGNMENT_COLUMNS,
    filters: CONSIGNMENT_FILTERS,
    exportFileName: 'ConsignmentCarsReport',
  },
  {
    key: 'daily-entries',
    route: 'daily-entries',
    dataSource: 'daily-entries',
    titleKey: 'CAR_REPORTS.DAILY_ENTRIES.TITLE',
    subtitleKey: 'CAR_REPORTS.DAILY_ENTRIES.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.DAILY_ENTRIES.TITLE',
    permissionPrefix: 'reports.carsDailyEntries',
    columns: DAILY_ENTRY_COLUMNS,
    filters: DAILY_ENTRY_FILTERS,
    exportFileName: 'DailyEntriesReport',
  },
  {
    key: 'delivery-schedule',
    route: 'delivery-schedule',
    dataSource: 'delivery-schedule',
    titleKey: 'CAR_REPORTS.DELIVERY_SCHEDULE.TITLE',
    subtitleKey: 'CAR_REPORTS.DELIVERY_SCHEDULE.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.DELIVERY_SCHEDULE.TITLE',
    permissionPrefix: 'reports.carsDeliverySchedule',
    columns: DELIVERY_COLUMNS,
    filters: DELIVERY_FILTERS,
    exportFileName: 'DeliveryScheduleReport',
  },
  {
    key: 'movement',
    route: 'movement',
    dataSource: 'cars-movement',
    titleKey: 'CAR_REPORTS.MOVEMENT.TITLE',
    subtitleKey: 'CAR_REPORTS.MOVEMENT.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.MOVEMENT.TITLE',
    permissionPrefix: 'reports.carsMovement',
    columns: DAILY_ENTRY_COLUMNS,
    filters: DAILY_ENTRY_FILTERS,
    exportFileName: 'CarMovementReport',
    dataCaveatKey: 'CAR_REPORTS.CAVEAT.MOVEMENT_FROM_ENTRIES',
  },
  {
    key: 'status',
    route: 'status',
    dataSource: 'cars-status',
    titleKey: 'CAR_REPORTS.STATUS.TITLE',
    subtitleKey: 'CAR_REPORTS.STATUS.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.STATUS.TITLE',
    permissionPrefix: 'reports.carsStatus',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CarStatusReport',
  },
  {
    key: 'by-branch',
    route: 'by-branch',
    dataSource: 'cars-by-branch',
    titleKey: 'CAR_REPORTS.BY_BRANCH.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_BRANCH.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_BRANCH.TITLE',
    permissionPrefix: 'reports.carsByBranch',
    columns: CAR_COLUMNS,
    filters: BY_BRANCH_FILTERS,
    exportFileName: 'CarsByBranchReport',
  },
  {
    key: 'by-warehouse',
    route: 'by-warehouse',
    dataSource: 'cars-by-warehouse',
    titleKey: 'CAR_REPORTS.BY_WAREHOUSE.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_WAREHOUSE.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_WAREHOUSE.TITLE',
    permissionPrefix: 'reports.carsByWarehouse',
    columns: CAR_COLUMNS,
    filters: BY_WAREHOUSE_FILTERS,
    exportFileName: 'CarsByWarehouseReport',
  },
  {
    key: 'by-supplier',
    route: 'by-supplier',
    dataSource: 'cars-by-supplier',
    titleKey: 'CAR_REPORTS.BY_SUPPLIER.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_SUPPLIER.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_SUPPLIER.TITLE',
    permissionPrefix: 'reports.carsBySupplier',
    columns: BY_SUPPLIER_COLUMNS,
    filters: CONSIGNMENT_FILTERS,
    exportFileName: 'CarsBySupplierReport',
  },
  {
    key: 'by-brand',
    route: 'by-brand',
    dataSource: 'cars-by-brand',
    titleKey: 'CAR_REPORTS.BY_BRAND.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_BRAND.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_BRAND.TITLE',
    permissionPrefix: 'reports.carsByBrand',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CarsByBrandReport',
  },
  {
    key: 'by-model',
    route: 'by-model',
    dataSource: 'cars-by-model',
    titleKey: 'CAR_REPORTS.BY_MODEL.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_MODEL.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_MODEL.TITLE',
    permissionPrefix: 'reports.carsByModel',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CarsByModelReport',
  },
  {
    key: 'by-year',
    route: 'by-year',
    dataSource: 'cars-by-year',
    titleKey: 'CAR_REPORTS.BY_YEAR.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_YEAR.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_YEAR.TITLE',
    permissionPrefix: 'reports.carsByYear',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CarsByYearReport',
  },
  {
    key: 'by-color',
    route: 'by-color',
    dataSource: 'cars-by-color',
    titleKey: 'CAR_REPORTS.BY_COLOR.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_COLOR.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_COLOR.TITLE',
    permissionPrefix: 'reports.carsByColor',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CarsByColorReport',
  },
  {
    key: 'by-vin',
    route: 'by-vin',
    dataSource: 'cars-by-vin',
    titleKey: 'CAR_REPORTS.BY_VIN.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_VIN.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_VIN.TITLE',
    permissionPrefix: 'reports.carsByVin',
    columns: CAR_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CarsByVinReport',
  },
  {
    key: 'by-engine',
    route: 'by-engine',
    dataSource: 'cars-by-engine',
    titleKey: 'CAR_REPORTS.BY_ENGINE.TITLE',
    subtitleKey: 'CAR_REPORTS.BY_ENGINE.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.BY_ENGINE.TITLE',
    permissionPrefix: 'reports.carsByEngine',
    columns: CONSIGNMENT_COLUMNS,
    filters: CONSIGNMENT_FILTERS,
    exportFileName: 'CarsByEngineNumberReport',
    dataCaveatKey: 'CAR_REPORTS.CAVEAT.ENGINE_CONSIGNMENT_ONLY',
  },
  {
    key: 'inventory-aging',
    route: 'inventory-aging',
    dataSource: 'cars-inventory-aging',
    titleKey: 'CAR_REPORTS.INVENTORY_AGING.TITLE',
    subtitleKey: 'CAR_REPORTS.INVENTORY_AGING.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.INVENTORY_AGING.TITLE',
    permissionPrefix: 'reports.carsInventoryAging',
    columns: AGING_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'InventoryAgingReport',
  },
  {
    key: 'inventory-valuation',
    route: 'inventory-valuation',
    dataSource: 'cars-inventory-valuation',
    titleKey: 'CAR_REPORTS.INVENTORY_VALUATION.TITLE',
    subtitleKey: 'CAR_REPORTS.INVENTORY_VALUATION.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.INVENTORY_VALUATION.TITLE',
    permissionPrefix: 'reports.carsInventoryValuation',
    columns: CAR_COST_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'InventoryValuationReport',
    dataCaveatKey: 'CAR_REPORTS.CAVEAT.VALUATION_METHOD_NOT_APPLIED',
  },
  {
    key: 'car-cost',
    route: 'car-cost',
    dataSource: 'cars-cost',
    titleKey: 'CAR_REPORTS.CAR_COST.TITLE',
    subtitleKey: 'CAR_REPORTS.CAR_COST.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.CAR_COST.TITLE',
    permissionPrefix: 'reports.carsCost',
    columns: CAR_COST_COLUMNS,
    filters: CAR_FILTERS,
    exportFileName: 'CarCostReport',
  },
  {
    key: 'car-profitability',
    route: 'car-profitability',
    dataSource: 'cars-profitability',
    titleKey: 'CAR_REPORTS.CAR_PROFITABILITY.TITLE',
    subtitleKey: 'CAR_REPORTS.CAR_PROFITABILITY.SUBTITLE',
    breadcrumbKey: 'CAR_REPORTS.CAR_PROFITABILITY.TITLE',
    permissionPrefix: 'reports.carsProfitability',
    columns: [
      ...CAR_COST_COLUMNS,
      { dataField: 'profit', captionKey: 'CAR_REPORTS.COL.PROFIT', dataType: 'currency', width: 130 },
    ],
    filters: CAR_FILTERS,
    exportFileName: 'CarProfitabilityReport',
    dataCaveatKey: 'CAR_REPORTS.CAVEAT.PROFITABILITY_SIMPLIFIED',
  },
];

export function getCarReportByKey(key: string): CarReportEntry | undefined {
  return CAR_REPORTS.find(r => r.key === key);
}
