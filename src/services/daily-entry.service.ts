import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DailyEntry, DailyEntryType } from '../types/daily-entry.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DailyEntryService {
  private apiUrl = `${environment.origin}/api/daily-entries`;

  private dailyEntries = signal<DailyEntry[]>([]);

  public dailyEntries$ = this.dailyEntries.asReadonly();

  constructor(private http: HttpClient) {
    this.loadDailyEntries();
  }

  loadDailyEntries(): void {
    this.http.get<DailyEntry[]>(this.apiUrl).pipe(
      tap(entries => {
        console.log('Daily entries loaded:', entries);
        this.dailyEntries.set(entries);
      })
    ).subscribe();
  }

  getAll(): Observable<DailyEntry[]> {
    return this.http.get<DailyEntry[]>(this.apiUrl);
  }

  getById(id: number): Observable<DailyEntry> {
    return this.http.get<DailyEntry>(`${this.apiUrl}/${id}`);
  }

  getByCarId(carId: number): Observable<DailyEntry[]> {
    return this.http.get<DailyEntry[]>(`${this.apiUrl}/car/${carId}`);
  }

  getByType(entryType: DailyEntryType): Observable<DailyEntry[]> {
    return this.http.get<DailyEntry[]>(`${this.apiUrl}/type/${entryType}`);
  }

  createEntry(entry: Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>): Observable<DailyEntry> {
    return this.http.post<DailyEntry>(this.apiUrl, entry).pipe(
      tap(newEntry => {
        this.dailyEntries.update(entries => [...entries, newEntry]);
      })
    );
  }

  updateEntry(id: number, entry: Partial<DailyEntry>): Observable<DailyEntry> {
    return this.http.put<DailyEntry>(`${this.apiUrl}/${id}`, entry).pipe(
      tap(updatedEntry => {
        this.dailyEntries.update(entries =>
          entries.map(e => e.id === id ? updatedEntry : e)
        );
      })
    );
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.dailyEntries.update(entries => entries.filter(e => e.id !== id));
      })
    );
  }

  // Helper methods for filtering
  getEntriesByDateRange(startDate: string, endDate: string): Observable<DailyEntry[]> {
    return this.http.get<DailyEntry[]>(`${this.apiUrl}/date-range`, {
      params: { startDate, endDate }
    });
  }

  getRecentEntries(days: number = 7): Observable<DailyEntry[]> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.getEntriesByDateRange(startDate, endDate);
  }
}