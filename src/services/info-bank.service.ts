import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { InfoBank } from '../types/info-bank.model';

@Injectable({
  providedIn: 'root'
})
export class InfoBankService {
  private apiUrl = `${environment.origin}/api/info-banks`;
  private infoBanksSignal = signal<InfoBank[]>([]);

  constructor(private http: HttpClient) {}

  get infoBanks() {
    return this.infoBanksSignal.asReadonly();
  }

  loadInfoBanks() {
    this.http.get<InfoBank[]>(this.apiUrl).subscribe(data => {
      this.infoBanksSignal.set(data);
    });
  }

  getInfoBank(id: number) {
    return this.http.get<InfoBank>(`${this.apiUrl}/${id}`);
  }

  createInfoBank(infoBank: InfoBank) {
    return this.http.post<InfoBank>(this.apiUrl, infoBank);
  }

  updateInfoBank(id: number, infoBank: InfoBank) {
    return this.http.put<InfoBank>(`${this.apiUrl}/${id}`, infoBank);
  }

  deleteInfoBank(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}