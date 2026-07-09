import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  PurchaseRequisitionDto,
  CreatePurchaseRequisitionDto,
  UpdatePurchaseRequisitionDto
} from '../models/purchase-requisition.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequisitionService {
  private apiUrl = environment.origin + 'api/PurchaseRequisitions';

  constructor(private http: HttpClient) { }

  getAll(): Observable<PurchaseRequisitionDto[]> {
    return this.http.get<PurchaseRequisitionDto[]>(`${this.apiUrl}/GetAll`);
  }

  getById(id: number): Observable<PurchaseRequisitionDto> {
    return this.http.get<PurchaseRequisitionDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreatePurchaseRequisitionDto): Observable<PurchaseRequisitionDto> {
    return this.http.post<PurchaseRequisitionDto>(`${this.apiUrl}/Create`, dto);
  }

  update(id: number, dto: UpdatePurchaseRequisitionDto): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  submit(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/submit`, {});
  }

  approve(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/approve`, {});
  }

  reject(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/reject`, {});
  }
}
