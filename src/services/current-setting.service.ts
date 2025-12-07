import { LocalStorageService } from './local-storage.service';
import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { BehaviorSubject, map } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CurrentSettingService {
  fontSize = 14;
  private isDirty = false;

  // Welcome data translations
  private welcomeData = {
    companyEn: 'Company',
    companyAr: 'الشركة',
    branchEn: 'Branch', 
    branchAr: 'الفرع',
    storeEn: 'Store',
    storeAr: 'المخزن'
  };

  private menuChanged = new BehaviorSubject<any>(null);
  menuChanged$ = this.menuChanged.asObservable();
  private documentsSubject = new BehaviorSubject<string>('');
  documents$ = this.documentsSubject.asObservable();

  updateMenuParams(change: any) {
    this.menuChanged.next(change);
  }


  constructor(private breakpointObserver: BreakpointObserver,private localStorageService:LocalStorageService,private title:Title,
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
  ) {
    // Initialize documents subject with stored value
    this.documentsSubject.next(this.localStorageService.getLocalStorage('documents') || '');
    window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));

  }


  getApplicationName(){
    return this.getCurrentLanguage() == 'en' ? 'WitsUP' : 'ويتسب' ;
  }

  getCurrentLanguage():string{
    return this.localStorageService.getItem('currentLanguage') || 'en' ;
  }

  setCompanyId(value:string){
    this.localStorageService.setLocalStorage('companyId',value);
  }
  setCompanyName(value:any){
    const companyNames = JSON.stringify(value);
    this.localStorageService.setLocalStorage('companyName',companyNames);
  }

  getCompanyId():number{
    try {
      return parseInt(this.localStorageService.getLocalStorage('companyId') || '0');
    } catch (error) {
      return 0;
    }
  }

  getCompanyName(): string {
    const companyNameStr = this.localStorageService.getLocalStorage('companyName');
    let companyNameObj: any = {};
    try {
      companyNameObj = companyNameStr ? JSON.parse(companyNameStr) : {};
    } catch (e) {
      this.router.navigate(['/' + environment.rootName + '/home']);
    }
    return this.localStorageService.getItem('currentLanguage') == 'en'
      ? companyNameObj.companyNameEn || ''
      : companyNameObj.companyNameAr || '';
  }

  setBranchId(value:string){
    this.localStorageService.setLocalStorage('branchId',value);
  }
  setBranchName(value:any){
    const branchName = JSON.stringify(value);
    this.localStorageService.setLocalStorage('branchName',branchName);
  }
  getBranchId():number{
    try {
      return parseInt(this.localStorageService.getLocalStorage('branchId') || '0');
    } catch (error) {
      return 0;
    }
  }
  getBranchName():string{
    const branchNameStr = this.localStorageService.getLocalStorage('branchName');
    let branchNameObj: any = {};
    try {
      branchNameObj = branchNameStr ? JSON.parse(branchNameStr) : {};
    } catch (e) {
      this.router.navigate(['/' + environment.rootName + '/home']);
    }
    return this.localStorageService.getItem('currentLanguage') == 'en'
      ? branchNameObj.branchNameEn || ''
      : branchNameObj.branchNameAr || '';
   }

  setStoreId(value:string){
    this.localStorageService.setLocalStorage('storeId',value);
  }
  setStoreName(value:any){
    const storeName = JSON.stringify(value);
    this.localStorageService.setLocalStorage('storeName',storeName);
  }

  getFullStoreName(){
     return this.getCurrentLanguage() == 'en' ?
        `${this.welcomeData.companyEn} : ${this.getCompanyName()} -
        ${this.welcomeData.branchEn} : ${this.getBranchName()} -
        ${this.welcomeData.storeEn} : ${this.getStoreName()}` :

        `${this.welcomeData.companyAr} : ${this.getCompanyName()} -
        ${this.welcomeData.branchAr} : ${this.getBranchName()} -
        ${this.welcomeData.storeAr} : ${this.getStoreName()}`;
  }

  getStoreId():number{
    try {
      return parseInt(this.localStorageService.getLocalStorage('storeId') || '0');
    } catch (error) {
      return 0;
    }
  }
  getStoreName():string{
    const storeNameStr = this.localStorageService.getLocalStorage('storeName');
    let storeNameObj: any = {};
    try {
      storeNameObj = storeNameStr ? JSON.parse(storeNameStr) : {};
    } catch (e) {
      this.router.navigate(['/' + environment.rootName + '/home']);
    }
    return this.localStorageService.getItem('currentLanguage') == 'en'
      ? storeNameObj.storeNameEn || ''
      : storeNameObj.storeNameAr || '';
  }

  setCurrencyId(value:string){
    this.localStorageService.setLocalStorage('currencyId',value);
  }

  getDocuments():string{
    return this.localStorageService.getLocalStorage('documents') || '';
  }

  setDocuments(value:string){
    this.localStorageService.setLocalStorage('documents',value);
    this.documentsSubject.next(value); // Notify subscribers
  }

  getMenus():string{
    debugger;
    return this.localStorageService.getLocalStorage('menus') || '';
  }

  setMenus(value:string){
    debugger;
    this.localStorageService.setLocalStorage('menus',value);
  }

  getUserFullName():string{
    return this.localStorageService.getLocalStorage('UserFullName') || '';
  }

  setUserFullName(value:string){
    this.localStorageService.setLocalStorage('UserFullName',value);
  }

  getCurrencyId():number{
    try {
      return parseInt(this.localStorageService.getLocalStorage('currencyId') || '0');
    } catch (error) {
      return 0;
    }
  }

  setCurrencyRounding(value:string){
    this.localStorageService.setLocalStorage('currencyRounding',value);
  }

  setFormToBeDirty(){
    this.isDirty = true;
    this.localStorageService.setItem('isDirty','true');
  }
  setFormToBeClean(){
    this.isDirty = false;
    this.localStorageService.setItem('isDirty','false');
  }

  private onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty) {
        event.preventDefault();
        event.returnValue = false;
    }
  }

  getCurrencyRounding():number{
    try {
      return parseInt(this.localStorageService.getLocalStorage('currencyRounding') || '0');
    } catch (error) {
      return 0;
    }
  }

  getCurrencyRoundingTotal(){
    var rounding = this.getCurrencyRounding();
    return rounding + 1;
  }

  getDxFormat(){
    var rounding = this.getCurrencyRounding();
    return rounding == 2 ? ',###,###,##0.00' : ',###,###,##0.000'
  }

  getDxFormatSummary(){
    var rounding = this.getCurrencyRoundingTotal();
    return rounding == 3 ? ',###,###,##0.000' : ',###,###,##0.0000'
  }

  getApplicationFullPath():string{
    debugger;
    return (this.getCompanyName() || '' ) + ' ›› ' + (this.getStoreName() || '');
  }

  getCompanyScreenTitle():string{
    debugger;
    return this.getCompanyName() || '' ;
  }

  getStoreScreenTitle():string{
    debugger;
    return this.getStoreName() || '' ;
  }
  isFormDirty():boolean{
    debugger;
    return (this.localStorageService.getLocalStorage('isDirty') || '') == "true" ;
  }

  setTitle(title:string){
    return this.title.setTitle(title);
  }

  hideMenu(){
    var menu = this.document.getElementById('application-menu') as HTMLInputElement;
    menu.style.display = 'none';
  }
  hideSideNav(){
    debugger;
    var marginBody = this.document.getElementById('margin-body') as HTMLInputElement;
    var sidenavMe = this.document.getElementById('side-nav-me') as HTMLInputElement;
    var toggleMenu = this.document.getElementById('side-nav-toggle') as HTMLInputElement;
    if(marginBody){
      marginBody.style.marginLeft = '0px';
      marginBody.style.marginRight = '0px';
    }
    if(sidenavMe){
      sidenavMe.style.display = 'none';
    }
    if(toggleMenu){
      toggleMenu.style.display = 'none';
    }
  }

  showSideNav(){
    debugger;
    var language = this.getCurrentLanguage();
    var marginBody = this.document.getElementById('margin-body') as HTMLInputElement;
    var sidenavMe = this.document.getElementById('side-nav-me') as HTMLInputElement;
    var toggleMenu = this.document.getElementById('side-nav-toggle') as HTMLInputElement;
    if(marginBody){
      language == 'en' ? marginBody.style.marginLeft = '115px' : marginBody.style.marginRight = '115px';
    }
    if(sidenavMe){
      sidenavMe.style.display = 'block';
    }
    if(toggleMenu){
      toggleMenu.style.display = 'block';
    }
  }

  showToggleMenu(){
    var toggleMenu = this.document.getElementById('side-nav-toggle') as HTMLInputElement;
    if(toggleMenu){
      toggleMenu.style.display = 'block';
    }
  }
  hideToggleMenu(){
    var toggleMenu = this.document.getElementById('side-nav-toggle') as HTMLInputElement;
    if(toggleMenu){
      toggleMenu.style.display = 'none';
    }
  }
  showMenu(){
    var menu = this.document.getElementById('application-menu') as HTMLInputElement;
    menu.style.display = 'block';
  }

  getCompanAddress(){
    var language = this.getCurrentLanguage();
    return language == 'ar' ? 'عنوان الشركة الافتراضي' : 'Default Company Address'
  }

  getCurrentCompany(){
    // Get Company Name From Local Storage that registered from settings page
   return this.localStorageService.getLocalStorage('currentCompany') || '' ;
  }

  getUserGridFontSize(){
    return this.localStorageService.getLocalStorage('gridFontSize') != null ? parseInt(this.localStorageService.getLocalStorage('gridFontSize') || '14') : 14;
  }
  getCardLayout(columns?:number){
    return this.breakpointObserver
    .observe([Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge])
    .pipe(
      map(result => {
        if (result.breakpoints[Breakpoints.XLarge]  || result.breakpoints[Breakpoints.Large] ) {
          return {
            columns: columns || 4,
            miniCard: { cols: 1,big:2, rows: 1 },
            chart: { cols: 1, rows: 2 },
            table: { cols: 1, rows: 4 },
          };
        }
        else if(result.breakpoints[Breakpoints.Medium]){
          return {
            columns: (columns || 4) - 1,
            miniCard: { cols: 1,big:2, rows: 1 },
            chart: { cols: 2, rows: 2 },
            table: { cols: 4, rows: 4 },
          };
        }
        else if(result.breakpoints[Breakpoints.Small]){
          return {
            columns: (columns || 4) - 2,
            miniCard: { cols: 1,big:1, rows: 1 },
            chart: { cols: 2, rows: 2 },
            table: { cols: 4, rows: 4 },
          };
        } else if(result.breakpoints[Breakpoints.XSmall]){
          return {
            columns: 1,
            miniCard: { cols: 1,big:1, rows: 1 },
            chart: { cols: 2, rows: 2 },
            table: { cols: 4, rows: 4 },
          };
        }else{
          return {
            columns: 1,
            miniCard: { cols: 1,big:1, rows: 1 },
            chart: { cols: 2, rows: 2 },
            table: { cols: 4, rows: 4 },
          };
        }
      })
    );
  }

  getCardLayoutSmallInputWithRemarks(){
    return this.breakpointObserver
    .observe([Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge])
    .pipe(
      map(result => {
        if (result.breakpoints[Breakpoints.XLarge]  || result.breakpoints[Breakpoints.Large] ) {
          return {
            columns: 10,
            miniCard: { cols: 2,big:4, rows: 1 }
          };
        }
        else if(result.breakpoints[Breakpoints.Medium]){
          return {
            columns: 10,
            miniCard: { cols: 2,big:4, rows: 1 },
            chart: { cols: 2, rows: 2 },
            table: { cols: 4, rows: 4 },
          };
        }
        else if(result.breakpoints[Breakpoints.Small]){
          return {
            columns: 8,
            miniCard: { cols: 2,big:3, rows: 1 },
            chart: { cols: 2, rows: 2 },
            table: { cols: 4, rows: 4 },
          };
        } else if(result.breakpoints[Breakpoints.XSmall]){
          return {
            columns: 1,
            miniCard: { cols: 1,big:1, rows: 1 },
            chart: { cols: 2, rows: 2 },
            table: { cols: 4, rows: 4 },
          };
        }else{
          return {
            columns: 1,
            miniCard: { cols: 1,big:1, rows: 1 },
            chart: { cols: 2, rows: 2 },
            table: { cols: 4, rows: 4 },
          };
        }
      })
    );
  }


  getCardLayoutWithBool(){
    return this.breakpointObserver
    .observe([Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge])
    .pipe(
      map(result => {
        if (result.breakpoints[Breakpoints.XLarge]  || result.breakpoints[Breakpoints.Large] ) {
          return {
            columns: 4,
            miniCard: { bool: 1, input: 3 },
          };
        }
        else if(result.breakpoints[Breakpoints.Medium]){
          return {
            columns: 3,
            miniCard: { bool: 1, input: 2},
          };
        }
        else if(result.breakpoints[Breakpoints.Small]){
          return {
            columns: 1,
            miniCard: {bool: 1, input: 1 },
          };
        } else if(result.breakpoints[Breakpoints.XSmall]){
          return {
            columns: 1,
            miniCard: { bool: 1, input: 1 },
          };
        }else{
          return {
            columns: 1,
            miniCard: { bool: 1, input: 1 },
          };
        }
      })
    );
  }


  getCardLayoutWithSelect(){
    return this.breakpointObserver
    .observe([Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge])
    .pipe(
      map(result => {
        if (result.breakpoints[Breakpoints.XLarge]  || result.breakpoints[Breakpoints.Large] ) {
          return {
            columns: 6,
            miniCard: { input: 1, select: 2 },
          };
        }
        else if(result.breakpoints[Breakpoints.Medium]){
          return {
            columns: 4,
            miniCard: { input: 1, select: 2},
          };
        }
        else if(result.breakpoints[Breakpoints.Small]){
          return {
            columns: 3,
            miniCard: {input: 1, select: 2 },
          };
        } else if(result.breakpoints[Breakpoints.XSmall]){
          return {
            columns: 1,
            miniCard: { input: 1, select: 1 },
          };
        }else{
          return {
            columns: 1,
            miniCard: { bool: 1, input: 1 },
          };
        }
      })
    );
  }

  usingSmallScreen(){
    return this.breakpointObserver
    .observe([Breakpoints.Handset,
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge])
    .pipe(
      map(result => {
        if (result.breakpoints[Breakpoints.XSmall] || result.breakpoints[Breakpoints.Handset] ) {
          return true;
        }
        else{
          return false;
        }
      })
    );
  }
}
