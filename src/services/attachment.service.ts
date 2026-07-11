import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Attachment } from '../models/attachment.model';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.origin}api/attachments`;

  getForDocument(documentType: string, documentId: number): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.baseUrl}/${documentType}/${documentId}`);
  }

  upload(file: File, documentType: string, documentId: number, userId: number): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('documentId', documentId.toString());
    formData.append('userId', userId.toString());
    return this.http.post<Attachment>(`${this.baseUrl}/upload`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  fileUrl(attachment: Attachment): string {
    return `${environment.origin}${attachment.fileUrl.replace(/^\//, '')}`;
  }
}
