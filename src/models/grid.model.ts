
export class gridWebSettingDto{
  public static pageSize: any= 20;
  public static allowedPageSizes:any = [20, 100, 200, 1000];
  public static pagerDisplayMode:any="full";
  public static allowGrouping:any=true;
  public static allowColumnReordering:any=true;
  public static allowColumnResizing:any=true;
  public static gridHeightTiny:any=250;
  public static gridHeightSmall:any=300;
  public static gridHeightMedium:any=400;
  public static gridHeightLarge:any=500;
  public static gridHeight:any=600;
  public static dropDownWidth:any= '100%';
  public static dropDownWidthMedium:any= '100%';
  public static dropDownHeight:any=undefined;
  public static dropDownGridHeight:any= '100%';
  public static dropDownGridHeightSmall:any=350;
  public static dropDownGridHeightMedium:any=400;
  public static columnNumbersAlignment:any='right';
  public static editMode:any ='cell';
  public static searchPanelWidthvw:any='30vw';
  public static searchPanelWidthSmall:any='290px';
  public static searchPanelWidthMedium:any='350px';
  public static dropDownOptions = {width:'50%',height:'50%',container: 'body'}
  public static dropDownOptionsMedium = { width: '75%', height: '50%',minHeight: '40%', maxHeight: '50%', container: 'body' };
  public static columnsHiding:any=false;
}
export class gridMobileSettingDto{
  public static pageSize : any= 10;
  public static allowedPageSizes:any = [10, 50, 100];
  public static pagerDisplayMode:any="compact";
  public static allowGrouping:any=false;
  public static allowColumnReordering:any=false;
  public static allowColumnResizing:any=false;
  public static gridHeightTiny:any='100%';
  public static gridHeightSmall:any='100%';
  public static gridHeightMedium:any='100%';
  public static gridHeightLarge:any='100%';
  public static gridHeight:any='auto';
  public static dropDownWidth:any= '100%';
  public static dropDownWidthMedium:any= '100%';
  public static dropDownHeight:any='100%';
  public static dropDownGridHeight:any= '100%';
  public static dropDownGridHeightSmall:any= '400px';
  public static dropDownGridHeightMedium:any= '350px';
  public static columnNumbersAlignment:any='center';
  public static editMode:any ='popup';
  public static searchPanelWidthvw:any='100%';
  public static searchPanelWidthSmall:any='100%';
  public static searchPanelWidthMedium:any='100%';
  public static dropDownOptions = {width:'100%',height:'auto',container: 'body'};
  public static dropDownOptionsMedium = { width: '100%', height: 'auto',minHeight: '50vh', maxHeight: '60vh', container: 'body' };
  public static columnsHiding:any=false;
}

export class dataGridConfigurationDto{
  // public static dataSource: any;
  //public static dataSourceUrl: string = '';
  public static dictionary: any[];
  public static allowExport: boolean = true;
  public static exportFileName: string = 'dataGrid';
  public static exportFormat = ['pdf','xlsx'];
  public static selectionMode: string = 'single';
  public static columnMinWidth: number = 50;
  public static remoteOperations: boolean = true;
  public static keyExpr?: string | string[];
  
  public static columnOrder: string;

  public static showInfoButton: boolean = false;
}
export interface dataGridColumnDto{
  dataField: string;
  dataType: string;
  caption?: string | null;
  visible?: boolean;
  showInColumnChooser?: boolean;
  format?: string | any;
  alignment?: string;
  cssClass?: string;
  cellTemplate?: any;
  minWidth?: number;
  width?: number | string;
  fixed?: boolean;
  trueText?: string;
  falseText?: string;
  sortOrder?: string;
  sortIndex?: number;
  lookup?:dataGridColumnLookupDto;
  filterOperations?: string[];
  customCalculateCellValue?: (rowData: any) => any;
  calculateCellValue?: (rowData: any) => any;
}

export interface dataGridColumnLookupDto{
  dataSource:any;
  valueExpr:string;
  displayExpr:string;
}

export interface dataGridColumnSummaryDto{
  column: string;
  summaryType: string;
  alignment?: any;
  displayFormat?: string;
  valueFormat?: string;
  skipEmptyValues?:boolean;
  calculateCustomSummary?: (options: any) => void;
  name?: string;
  showInColumn?: string;
}


export class dataGridData {
  public static singleSelectionMode = 'single';
  public static multipleSelectionMode = 'multiple';
  public static summarySum = 'sum';
  public static summaryMin = 'min';
  public static summaryMax = 'max';
  public static summaryAvg = 'avg';
  public static summaryCount = 'count';
  public static alignmentRight = 'right';
  public static alignmentCenter = 'center';
  public static alignmentLeft = 'left';
  public static dataTypeNumber = 'number';
  public static dataTypeBoolean = 'boolean';
  public static dataTypeLockup = 'lockup';
  public static dataTypeString = 'string';
  public static dataTypeDate = 'date';
  public static dataTypeDatetime = 'datetime';
  public static dateFormat = 'dd/MM/yyyy';
  public static datetimeFormat = 'dd/MM/yyyy hh:mm:ss a';
  public static defaultDisplayFormat = '{0}';
  public static filterOperationsNumericOrDate = ['=', '<>', '<', '<=', '>', '>=', 'contains', 'notcontains', 'startswith', 'endswith'];
  public static filterOperationsString = [ "contains", "notcontains", "startswith", "endswith", "=", "<>", "isblank", "isnotblank"];
  public static filterOperationsBoolean =[ "=", "<>", "isblank", "isnotblank"];
  public static filterOperationsObject =[ "isblank", "isnotblank"];
  public static filterOperationsLockup =['=', 'anyof'];
}

export class printFormData {
  public static formal = 1;
  public static semiFormal = 2;
}


export type Condition = Condition[] | string | number;

export class filterOperations {
  public static equal = '=';
  public static notEqual = '<>';
  public static lessThan = '<';
  public static lessThanOrEqual = '<=';
  public static greaterThan = '>';
  public static greaterThanOrEqual = '>=';
  public static contains = 'contains';
  public static notContains = 'notcontains';
  public static startsWith = 'startswith';
  public static endsWith = 'endswith';
  public static isBlank = 'isblank';
  public static isNotBlank = 'isnotblank';
  public static anyOf = 'anyof';
  public static noneOf = 'noneof';

  public static getFilterOperation(dataType: string) {
    switch (dataType) {
      case dataGridData.dataTypeNumber:
      case dataGridData.dataTypeDate:
      case dataGridData.dataTypeDatetime:
        return dataGridData.filterOperationsNumericOrDate;
      case dataGridData.dataTypeString:
        return dataGridData.filterOperationsString;
      case dataGridData.dataTypeBoolean:
        return dataGridData.filterOperationsBoolean;
      case dataGridData.dataTypeLockup:
        return dataGridData.filterOperationsLockup;
      default:
        return dataGridData.filterOperationsObject;
    }
  }

}

export interface dropDownButton{
  id: number;
  text: string;
  icon: string;
}

export interface PrintOptions {
  /** Array of strings for header lines (will be rendered as separate <div> elements). */
  headerLines: (string | null)[];
  /** Array of strings for footer lines (will be rendered as separate <div> elements). */
  footerLines: (string | null)[];
  /** Array of column names for the table header. */
  tableColumns: any[];
  /**
   * Table data rows.
   * Each row can be:
   * - an object where keys match the column names in tableColumns, or
   * - an array whose cells will be rendered in order.
   */
  tableData: any[];
  /** Optional document title (used in the <title> tag and optionally in the header). */
  title?: string;
}

export interface reportFilterDto {
  fullPeriod:boolean;
  basedOnCompany:boolean;
  basedOnStore:boolean;
  fromDate?:Date;
  toDate?:Date;
  storeIds?: string;
  storeNames?: string;
  companyIds?: string;
  companyNames?: string;
  inputBoolean?: boolean;
  inputBoolean2?: boolean;
  autoCompleteNumber?: number;
  autoCompleteNumber2?: number;
  selectedDropDownData?: string;
  selectedDropDownData2?: string;
  inputDate?: Date;
  singlePickerInput?: Date;
  inputNumber?: number;
  accountId: number;
}

export interface autoCompleteDto{
  autoCompleteId:string;
  autoCompleteCode:string;
  autoCompleteName:string;
}

export interface dropDownDto{
  dropDownId:number;
  dropDownName:string;
}
export interface inputsParametersDto {
  autoCompleteDataSource?: autoCompleteDto[];
  autoCompleteLabel?:string;
  autoCompleteDataSource2?: autoCompleteDto[];
  autoCompleteLabel2?:string;
  booleanDropDownLabel?:string;
  booleanTrueLabel?:string;
  booleanFalseLabel?:string;
  booleanDropDownLabel2?:string;
  multiSelectLabel?:string;
  selectDropDownLabel2?:string;
  multiSelectDataSource?:dropDownDto[];
  multiSelectDataSourceFiltered?:dropDownDto[];
  selectDataSource2?:dropDownDto[];
  selectDataSourceFiltered2?:dropDownDto[];
  datePickerLabel?:string;
  isMultiSelect?:boolean;
  isMultiSelect2?:boolean;
  isStoreMultiSelect:boolean;
  isCompanyMultiSelect?:boolean;
  showFromDate?:boolean;
  showToDate?:boolean;
  singlePickerLabel?:string;
  isRangeMode:boolean;  
  numberInputLabel?:string;
  accountIdLabel?:string
}

export class treeListConfigurationDto{
  public static dictionary: any[];
  // public static allowExport: boolean = true;
  // public static exportFileName: string = 'treeList';
  // public static exportFormat = ['pdf','xlsx'];
  // public static selectionMode: string = 'single';
  public static columnMinWidth: number = 50;
  public static remoteOperations = {
    filtering: true,
    grouping: true,
    sorting: true
  };
  public static selectionMode: string = 'single';
  public static keyExpr: string ;
  public static parentIdExpr: string ;
  
  public static columnOrder: string;

  public static showInfoButton: boolean = false;
}
