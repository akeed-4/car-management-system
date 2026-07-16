import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { DocumentAuditTrailEntryDto } from '../models/document-lifecycle.model';

/** Read-only access to DocumentAuditTrail -- rows are written internally by the backend's ApprovalManager. */
@Injectable({
  providedIn: 'root'
})
export class DocumentAuditTrailService {
  private apiUrl = environment.origin + 'api/DocumentAuditTrail';

  constructor(private http: HttpClient) { }

  getHistory(entityName: string, entityId: number): Observable<DocumentAuditTrailEntryDto[]> {
    return this.http.get<DocumentAuditTrailEntryDto[]>(this.apiUrl, {
      params: { entityName, entityId }
    });
  }
}
