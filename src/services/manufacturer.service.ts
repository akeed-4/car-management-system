import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Manufacturer } from '../types/manufacturer.model';

@Injectable({
  providedIn: 'root',
})
export class ManufacturerService {
  private manufacturers = signal<Manufacturer[]>([]);
  public manufacturers$ = this.manufacturers.asReadonly();

  // رابط API الخاص بك
  private apiUrl = 'https://api.example.com/manufacturers';

  constructor(private http: HttpClient) {
    this.loadManufacturersFromApi();
  }

  // جلب بيانات المصنعين من API
  async loadManufacturersFromApi() {
    try {
      const data = await firstValueFrom(this.http.get<Manufacturer[]>(this.apiUrl));
      this.manufacturers.set(data);
    } catch (error) {
      console.error('Failed to fetch manufacturers from API', error);
    }
  }

  // إضافة مصنع جديد محليًا + يمكن تعديل ليكون عبر POST API
  addManufacturer(manufacturer: Omit<Manufacturer, 'id'>) {
    const newId = this.manufacturers().length ? Math.max(...this.manufacturers().map(m => m.id)) + 1 : 1;
    const newManufacturer: Manufacturer = { ...manufacturer, id: newId };
    this.manufacturers.update(list => [...list, newManufacturer]);

    // إذا أردت يمكن استدعاء API POST هنا
    // this.http.post(this.apiUrl, newManufacturer).subscribe();
  }

  // حذف مصنع محليًا + يمكن تعديل ليكون عبر DELETE API
  deleteManufacturer(id: number) {
    this.manufacturers.update(list => list.filter(m => m.id !== id));

    // إذا أردت يمكن استدعاء API DELETE هنا
    // this.http.delete(`${this.apiUrl}/${id}`).subscribe();
  }
}
