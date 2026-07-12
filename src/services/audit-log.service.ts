import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface AuditLogEntry {
  id: number;
  entityName: string;
  entityId: number;
  action: 'Create' | 'Update' | 'Delete';
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy: number;
  changedByName: string;
  changedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/AuditLogs';

  getHistory(entityName: string, entityId: number): Observable<ApiResponse<AuditLogEntry[]>> {
    return this.http.get<ApiResponse<AuditLogEntry[]>>(this.apiUrl, {
      params: { entityName, entityId },
    });
  }
}
