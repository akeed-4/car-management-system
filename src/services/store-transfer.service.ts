import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { StoreTransfer, CreateStoreTransferDto } from '../models/store-transfer.model';

@Injectable({
  providedIn: 'root'
})
export class StoreTransferService {
  private readonly baseUrl = `${environment.origin}api/StoreTransfers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<StoreTransfer[]> {
    return this.http.get<StoreTransfer[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: number): Observable<StoreTransfer> {
    return this.http.get<StoreTransfer>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateStoreTransferDto): Observable<StoreTransfer> {
    return this.http.post<StoreTransfer>(`${this.baseUrl}/Create`, dto);
  }

  approve(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Approve/${id}`, {});
  }

  reject(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Reject/${id}`, {});
  }
}
