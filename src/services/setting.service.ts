import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CostPriceCalculationSetting } from '../models/cost-price-calculation-setting.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingService {

  constructor(private http: HttpClient) {}

  private apiURL = environment.origin + '/ApplicationSettings';
  private printSetting = environment.origin + '/ReportPrintSettings';
  private costPriceApiURL = environment.origin + '/CostPriceCalculationSettings';

  getSettingTabs() {
    return this.http.get<any[]>(`${this.apiURL}/GetSettingTabs`);
  }
  getSettingTabCards(applicationFlagTabId:number,companyId?:number,) {
    return this.http.get<any[]>(`${this.apiURL}/GetSettingTabCards?companyId=${companyId}&applicationFlagTabId=${applicationFlagTabId}`);
  }

  getPrintSetting(menuCode:number|null) {
    if(menuCode != null){
      return this.http.get<any>(`${this.printSetting}/GetReportPrintSetting?menuCode=${menuCode}`);
    }
    return this.http.get<any>(`${this.printSetting}/GetReportPrintSetting`);
  }

  showItemsGrouped(storeId:number){
    return this.http.get<boolean>(`${this.apiURL}/ShowItemsGrouped?storeId=${storeId}`);
  }

  save(models: any[]) {
    return this.http.post<any[]>(this.apiURL, models);
  }


  // Returns the upload URL for the dx-file-uploader
  getUploadUrl(): string {
    return `${this.apiURL}/UploadImage`;
  }

  uploadImage(file: File,companyId:number,applicationFlagDetailId:number,applicationFlagTypeId:number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationFlagDetailId', applicationFlagDetailId.toString());
    formData.append('applicationFlagTypeId', applicationFlagTypeId.toString());
    formData.append('companyId', companyId.toString());
    return this.http.post<any>(`${this.apiURL}/UploadImage`, formData);
  }

  // Download an image file by its file name
  downloadImage(companyId:number,applicationFlagDetailId:number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiURL}/DownloadImage?companyId=${companyId}&applicationFlagDetailId=${applicationFlagDetailId}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }


  // Construct the full URL for viewing the image
  getImage(companyId:number,applicationFlagDetailId:number): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/ViewImage?companyId=${companyId}&applicationFlagDetailId=${applicationFlagDetailId}`);
  }

  // Cost Price Calculation Settings Methods
  getCostPriceCalculationSettings(companyId: number): Observable<CostPriceCalculationSetting> {
    return this.http.get<CostPriceCalculationSetting>(`${this.costPriceApiURL}/GetByCompanyId/${companyId}`);
  }

  saveCostPriceCalculationSettings(settings: CostPriceCalculationSetting): Observable<CostPriceCalculationSetting> {
    if (settings.id) {
      return this.http.put<CostPriceCalculationSetting>(`${this.costPriceApiURL}/Update/${settings.id}`, settings);
    } else {
      return this.http.post<CostPriceCalculationSetting>(`${this.costPriceApiURL}/Create`, settings);
    }
  }

  deleteCostPriceCalculationSettings(id: number): Observable<void> {
    return this.http.delete<void>(`${this.costPriceApiURL}/Delete/${id}`);
  }

}
