import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ManufactureYearService {
  private yearsSignal = signal<number[]>([]);
  public years$ = this.yearsSignal.asReadonly();

  /** Unlike years$ (plain year values), carries each Model Year's real Id -- needed as a foreign
   *  key by the Year Specification screen's Model Year dropdown. */
  private yearsWithIdsSignal = signal<{ id: number; year: number }[]>([]);
  public yearsWithIds$ = this.yearsWithIdsSignal.asReadonly();

  // ضع رابط API الخاص بك هنا
   private apiUrl = environment.origin+'api/CarModels';

  constructor(private http: HttpClient) {
    this.loadYearsFromApi();
    this.loadYearsWithIdsFromApi();
  }

  async loadYearsWithIdsFromApi() {
    try {
      const years = await firstValueFrom(this.http.get<{ id: number; year: number }[]>(this.apiUrl + '/years-with-ids'));
      this.yearsWithIdsSignal.set(years.sort((a, b) => b.year - a.year));
    } catch (error) {
      console.error('Failed to fetch manufacture years with ids from API', error);
    }
  }

  // تحميل السنوات من API
  async loadYearsFromApi() {
    try {
      const years = await firstValueFrom(this.http.get<number[]>(this.apiUrl+'/years'));
      this.yearsSignal.set(years.sort((a, b) => b - a)); // ترتيب تنازلي
    } catch (error) {
      console.error('Failed to fetch manufacture years from API', error);
    }
  }

  // إضافة سنة جديدة
  async addYear(year: number) {
    try {
      await firstValueFrom(this.http.post(this.apiUrl + '/AddYear',  year ));
      // Reload the list from API
      await this.loadYearsFromApi();
      await this.loadYearsWithIdsFromApi();
    } catch (error) {
      console.error('Failed to add manufacture year', error);
      throw error;
    }
  }

  // تحديث سنة موجودة
  async updateYear(oldYear: number, newYear: number) {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/UpdateYear/${oldYear}`, { year: newYear }));
      // Reload the list from API
      await this.loadYearsFromApi();
    } catch (error) {
      console.error('Failed to update manufacture year', error);
      throw error;
    }
  }

  // حذف سنة
  async deleteYear(year: number) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/DeleteYear/${year}`));
      // Reload the list from API
      await this.loadYearsFromApi();
    } catch (error) {
      console.error('Failed to delete manufacture year', error);
      throw error;
    }
  }
}
