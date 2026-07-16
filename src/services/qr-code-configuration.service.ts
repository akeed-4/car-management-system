import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  QrCodeConfigurationDto,
  CreateQrCodeConfigurationDto,
  UpdateQrCodeConfigurationDto
} from '../models/qr-code.model';

/** CRUD for QrCodeConfiguration -- one row per company. */
@Injectable({
  providedIn: 'root'
})
export class QrCodeConfigurationService {
  private apiUrl = environment.origin + 'api/QrCodeConfiguration';

  constructor(private http: HttpClient) { }

  getAll(): Observable<QrCodeConfigurationDto[]> {
    return this.http.get<QrCodeConfigurationDto[]>(this.apiUrl);
  }

  getByCompany(companyId: number): Observable<QrCodeConfigurationDto> {
    return this.http.get<QrCodeConfigurationDto>(`${this.apiUrl}/GetByCompany/${companyId}`);
  }

  create(dto: CreateQrCodeConfigurationDto): Observable<QrCodeConfigurationDto> {
    return this.http.post<QrCodeConfigurationDto>(`${this.apiUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateQrCodeConfigurationDto): Observable<QrCodeConfigurationDto> {
    return this.http.put<QrCodeConfigurationDto>(`${this.apiUrl}/Update/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}
