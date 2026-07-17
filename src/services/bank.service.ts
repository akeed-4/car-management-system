import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Bank, CreateBankDto, UpdateBankDto } from '../models/bank.model';

@Injectable({
  providedIn: 'root'
})
export class BankService {
  private readonly baseUrl = `${environment.origin}api/Banks`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Bank[]> {
    return this.http.get<Bank[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: number): Observable<Bank> {
    return this.http.get<Bank>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateBankDto): Observable<Bank> {
    return this.http.post<Bank>(`${this.baseUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateBankDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Update/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
