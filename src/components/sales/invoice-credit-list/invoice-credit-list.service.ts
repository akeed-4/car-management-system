import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { InvoiceCreditListComponent } from './invoice-credit-list.component';
import { creditInvoiceLanguageData, creditInvoiceList } from './invoice-credit-list.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceCreditListService {
  constructor(private http: HttpClient) {}

  private apiURL = environment.origin + '/Stores';

  getcreditInvoiceListDictionary() {
    return creditInvoiceLanguageData.InvoiceCreditListDictionary;
  }
}
