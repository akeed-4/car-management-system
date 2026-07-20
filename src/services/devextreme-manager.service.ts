import { HttpClient } from '@angular/common/http';
import { Injectable, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

// Factory function to create sendRequest function for DevExtreme AJAX
function sendRequestFactory(httpClient: HttpClient) {
  return (options: any) => {
    // Convert DevExtreme request options to Angular HttpClient call
    const method = options.method || 'GET';
    const url = options.url;
    const config: any = {
      headers: options.headers || {},
      params: options.params || {}
    };

    if (options.data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = options.data;
    }

    return firstValueFrom(httpClient.request(method, url, config));
  };
}

@Injectable({
  providedIn: 'root',
})
export class DevextremeManagerService {
  
  constructor(
    private httpClient: HttpClient,
    private localStorageService: LocalStorageService,
    private translateService:TranslateService,
    private dialog:MatDialog,
  ) {}

  saveGrid = 'saveGrid';
  resetGrid = 'resetGrid';
  printSettings = 'printSettings';
  private isStateStoreEnabled= false;
  private dxConfig: any = null;
  private overlayObserver: MutationObserver | null = null;
  private isHighZIndexMode = false;

  /**
   * Handle DevExtreme dropdown opening event
   * Automatically adjusts z-index if component is inside a dialog
   * 
   * @example In your component:
   * onBoxOptionChanged(e: any) {
   *   if (e.name === 'value') {
   *     // Handle value changes
   *   }
   *   
   *   if (e.name === 'opened') {
   *     if (e.value === true) {
   *       this.devextremeManagerService.onDevExtremeComponentOpening();
   *     } else if (e.value === false) {
   *       this.devextremeManagerService.onDevExtremeComponentClosed();
   *     }
   *   }
   * }
   * 
   * @example In your template:
   * <dx-drop-down-box (onOptionChanged)="onBoxOptionChanged($event)">
   */
  async onDevExtremeComponentOpening(): Promise<void> {
    const isInDialog = this.isInsideDialog();
    if (isInDialog) {
      this.isHighZIndexMode = true;
      // Start observing for new overlays
      this.startObservingOverlays();
      // Apply to existing overlays immediately and after a delay
      this.applyHighZIndex();
      setTimeout(() => this.applyHighZIndex(), 50);
      setTimeout(() => this.applyHighZIndex(), 150);
      setTimeout(() => this.applyHighZIndex(), 300);
    }
  }

  /**
   * Handle DevExtreme dropdown closing event
   * Resets z-index to default after component closes
   */
  async onDevExtremeComponentClosed(): Promise<void> {
    this.isHighZIndexMode = false;
    // Stop observing
    this.stopObservingOverlays();
    // Small delay to allow closing animation
    setTimeout(() => {
      this.resetZIndex();
    }, 100);
  }

  /**
   * Start observing DOM for new DevExtreme overlays
   */
  private startObservingOverlays(): void {
    if (this.overlayObserver) {
      this.overlayObserver.disconnect();
    }

    this.overlayObserver = new MutationObserver((mutations) => {
      if (this.isHighZIndexMode) {
        this.applyHighZIndex();
      }
    });

    this.overlayObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Stop observing DOM for overlays
   */
  private stopObservingOverlays(): void {
    if (this.overlayObserver) {
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }
  }

  /**
   * Apply high z-index to DevExtreme overlays using DOM manipulation
   */
  private applyHighZIndex(): void {
    // Find all DevExtreme overlay containers and set high z-index
    const selectors = [
      '.dx-overlay-wrapper',
      '.dx-popup-wrapper',
      '.dx-dropdowneditor-overlay',
      '.dx-dropdownlist-popup-wrapper',
      '.dx-popup',
      '.dx-overlay-content'
    ];

    let appliedCount = 0;
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element: any) => {
        if (element.style) {
          element.style.zIndex = '10000';
          appliedCount++;
        }
        // Also check parent wrapper
        const parent = element.parentElement;
        if (parent && parent.classList.contains('dx-overlay-wrapper')) {
          parent.style.zIndex = '10000';
        }
      });
    });
    
  }

  /**
   * Reset z-index to default
   */
  private resetZIndex(): void {
    const selectors = [
      '.dx-overlay-wrapper',
      '.dx-popup-wrapper',
      '.dx-dropdowneditor-overlay',
      '.dx-dropdownlist-popup-wrapper',
      '.dx-popup',
      '.dx-overlay-content'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element: any) => {
        if (element.style && element.style.zIndex === '10000') {
          element.style.zIndex = '';
        }
      });
    });
  }

  /**
   * Check if currently inside a Material Dialog
   */
  private isInsideDialog(): boolean {
    const dialogContainers = document.querySelectorAll('.mat-mdc-dialog-container, .mat-dialog-container');
    return dialogContainers.length > 0;
  }

  async getDxGrid() {
    return await import('devextreme-angular/ui/data-grid');
  }
  async getDxDropDown() {
    return await import('devextreme-angular/ui/drop-down-box');
  }
  async getDxTooltip() {
    return await import('devextreme-angular/ui/tooltip');
  }

  async getDxTreeView() {
    return await import('devextreme-angular/ui/tree-view');
  }

  async getDxTreeList() {
    return await import('devextreme-angular/ui/tree-list');
  }

  async getDxValidator() {
    return await import('devextreme-angular/ui/validator');
  }

  async getDxLocalization() {
    return await import('devextreme/localization');
  }

  async getAspNetData() {
    // This package is not installed, return null
    return null;
  }

  async getDxArabicTranslation(): Promise<any> {
    return await import('devextreme/localization/messages/ar.json');
  }
  async getDxAjax(): Promise<any> {
    return await import('devextreme/core/utils/ajax');
  }

  async getDxEvents(): Promise<any> {
    return await import('devextreme/events');
  }

  async getDxArrayStore(): Promise<any> {
    return await import('devextreme/data/array_store');
  }

  async getExcelExporter(): Promise<any> {
    return await import('devextreme/excel_exporter');
  }

  async getPdfExporter(): Promise<any> {
    return await import('devextreme/pdf_exporter');
  }


  async initializeDevExtreme() {
    debugger;
    const dxAjax = await this.getDxAjax();
    const dxLocalization = await this.getDxLocalization();
    const arabicTranslation = await this.getDxArabicTranslation();
    this.dxConfig = await import('devextreme/core/config');

    dxAjax.default.inject({ sendRequest: sendRequestFactory(this.httpClient) });

    dxLocalization.loadMessages(arabicTranslation.default);
    dxLocalization.locale(this.getLocalLang());
    
    // Set default z-index for DevExtreme overlays
    // This will be dynamically adjusted when inside dialogs
    this.dxConfig.default({ floatingActionButtonConfig: { zIndex: 1500 } });
  }

  getLocalLang() {
    return this.localStorageService.getItem('currentLanguage') || 'en';
  }

  getStateStoreValue(key:string|null){
    if(key){
      return this.isStateStoringKeyExist(key);
    }
    return this.isStateStoreEnabled;
  }

  getDataGridDropDownButton(){
    return [
      { id: this.saveGrid, text: this.translateService.instant('dxDataGrid.saveGrid'), icon: "save" },
      { id: this.resetGrid, text: this.translateService.instant('dxDataGrid.resetGrid'), icon: "revert" },
    ];
  }

  getReportGridDropDownButton(){
    return [
      { id: this.saveGrid, text: this.translateService.instant('dxDataGrid.saveGrid'), icon: "save" },
      { id: this.resetGrid, text: this.translateService.instant('dxDataGrid.resetGrid'), icon: "revert" },
      { id: this.printSettings, text: this.translateService.instant('dxDataGrid.printSetting'), icon: "print" },
    ];
  }

  handleActionButton(e: any, dataGrid: any,storageKey:string,columnName:string) {
    if (e.itemData.id === this.saveGrid) {
      this.enableStateStoring(dataGrid,columnName);
    }
    if (e.itemData.id === this.resetGrid) {
      this.resetState(dataGrid,storageKey);
    }
  }

  handleReportActionButton(e: any, dataGrid: any,storageKey:string,columnName:string,companyId:number,menuCode:number|null){
    if (e.itemData.id === this.saveGrid) {
      this.enableStateStoring(dataGrid,columnName);
    }
    if (e.itemData.id === this.resetGrid) {
      this.resetState(dataGrid,storageKey);
    }

  }

  private enableStateStoring(dataGrid: any,columnName:string) {
    setTimeout(() => {
      this.sortDataGrid(dataGrid,columnName);
    }, 500);
    this.setStateStoreVale(true);
  }

  private resetState(dataGrid: any,storageKey:string): void {
    this.setStateStoreVale(false);
    dataGrid.instance.state(null);
    setTimeout(() => {
      this.localStorageService.removeItem(storageKey);
    }, 2000);
  }

  private sortDataGrid(dataGrid: any,columnName:string): void {
    dataGrid.instance.columnOption(columnName, 'sortOrder', 'asc');
    dataGrid.instance.columnOption(columnName, 'sortOrder', undefined);
    dataGrid.instance.refresh();
  }

  private setStateStoreVale(isStateStoreEnabled:boolean){
    this.isStateStoreEnabled = isStateStoreEnabled;
  }

  private isStateStoringKeyExist(key:string){
    var item = this.localStorageService.getItem(key);
    if(item?.length > 0){
      return true;
    }
    return false;
  }

  
}
