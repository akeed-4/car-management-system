import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ManufactureYearService {
  private yearsSignal = signal<number[]>([]);
  public years$ = this.yearsSignal.asReadonly();

  // ضع رابط API الخاص بك هنا
  private apiUrl = 'https://api.example.com/manufacture-years';

  constructor(private http: HttpClient) {
    this.loadYearsFromApi();
  }

  // تحميل السنوات من API
  async loadYearsFromApi() {
    try {
      const years = await firstValueFrom(this.http.get<number[]>(this.apiUrl));
      this.yearsSignal.set(years.sort((a, b) => b - a)); // ترتيب تنازلي
    } catch (error) {
      console.error('Failed to fetch manufacture years from API', error);
    }
  }

  // إضافة سنة جديدة محليًا
  addYear(year: number) {
    this.yearsSignal.update(years => {
      if (years.includes(year)) return years; // تجنب التكرار
      return [...years, year].sort((a, b) => b - a);
    });
  }
}
