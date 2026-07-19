import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  DocumentLifecycleSettingDto,
  CreateDocumentLifecycleSettingDto,
  UpdateDocumentLifecycleSettingDto
} from '../models/document-lifecycle.model';

/** CRUD for DocumentLifecycleSetting (AutoApproveOnSave per company/document type). */
@Injectable({
  providedIn: 'root'
})
export class DocumentLifecycleService {
  private apiUrl = environment.origin + 'api/DocumentSettings/Lifecycle';

  constructor(private http: HttpClient) { }

  getAll(): Observable<DocumentLifecycleSettingDto[]> {
    return this.http.get<DocumentLifecycleSettingDto[]>(this.apiUrl);
  }

  getByCompanyAndDocumentType(companyId: number, documentType: string): Observable<DocumentLifecycleSettingDto> {
    return this.http.get<DocumentLifecycleSettingDto>(`${this.apiUrl}/GetByCompanyAndDocumentType/${companyId}/${documentType}`);
  }

  create(dto: CreateDocumentLifecycleSettingDto): Observable<DocumentLifecycleSettingDto> {
    return this.http.post<DocumentLifecycleSettingDto>(`${this.apiUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateDocumentLifecycleSettingDto): Observable<DocumentLifecycleSettingDto> {
    return this.http.put<DocumentLifecycleSettingDto>(`${this.apiUrl}/Update/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}
