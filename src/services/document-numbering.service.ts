import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  DocumentNumberingSettingDto,
  CreateDocumentNumberingSettingDto,
  UpdateDocumentNumberingSettingDto
} from '../models/document-lifecycle.model';

/** CRUD for DocumentNumberingSetting. Actual number generation happens server-side only. */
@Injectable({
  providedIn: 'root'
})
export class DocumentNumberingService {
  private apiUrl = environment.origin + 'api/DocumentSettings/Numbering';

  constructor(private http: HttpClient) { }

  getAll(): Observable<DocumentNumberingSettingDto[]> {
    return this.http.get<DocumentNumberingSettingDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<DocumentNumberingSettingDto> {
    return this.http.get<DocumentNumberingSettingDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateDocumentNumberingSettingDto): Observable<DocumentNumberingSettingDto> {
    return this.http.post<DocumentNumberingSettingDto>(`${this.apiUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateDocumentNumberingSettingDto): Observable<DocumentNumberingSettingDto> {
    return this.http.put<DocumentNumberingSettingDto>(`${this.apiUrl}/Update/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }

  /** Administrator-only: resets this setting's current sequence bucket back to zero so the next
   * generated number starts at startingNumber again. Does not affect existing documents. */
  resetSequence(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/ResetSequence`, {});
  }
}
