export type ReportFilterKey =
  | 'companyId'
  | 'branchId'
  | 'warehouseId'
  | 'brandId'
  | 'modelId'
  | 'categoryId'
  | 'supplierId'
  | 'color'
  | 'status'
  | 'vin'
  | 'engineNumber'
  | 'dateFrom'
  | 'dateTo'
  | 'year'
  | 'salesStatus';

export type ReportFilterControl = 'select' | 'text' | 'date' | 'number';

export interface ReportFilterFieldConfig {
  key: ReportFilterKey;
  labelKey: string;
  control: ReportFilterControl;
  optionsSource?: 'branches' | 'warehouses' | 'brands' | 'models' | 'categories' | 'suppliers' | 'colors' | 'carStatus' | 'salesStatus';
}

export type ReportColumnDataType = 'string' | 'number' | 'date' | 'boolean' | 'currency';

export interface ReportColumnConfig {
  dataField: string;
  captionKey: string;
  dataType?: ReportColumnDataType;
  width?: number;
  visible?: boolean;
}

export interface ReportFilters {
  companyId?: number | null;
  branchId?: number | null;
  warehouseId?: number | null;
  brandId?: number | null;
  modelId?: number | null;
  categoryId?: number | null;
  supplierId?: number | null;
  color?: string | null;
  status?: string | null;
  vin?: string | null;
  engineNumber?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  year?: number | null;
  salesStatus?: string | null;
}

export interface ReportConfig {
  key: string;
  route: string;
  titleKey: string;
  subtitleKey: string;
  breadcrumbKey: string;
  permissionPrefix: string;
  columns: ReportColumnConfig[];
  filters: ReportFilterFieldConfig[];
  exportFileName: string;
  /** When the underlying data source has a known gap (see audit), show a caveat banner instead of pretending completeness. */
  dataCaveatKey?: string;
}
