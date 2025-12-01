import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ManufactureYearService {
  private yearsSignal = signal<number[]>([
    2025, 2024, 2023, 2022, 2021, 2020
  ]);

  public years$ = this.yearsSignal.asReadonly();

  addYear(year: number) {
    this.yearsSignal.update(years => {
      if (years.includes(year)) {
        return years; // Avoid duplicates
      }
      return [...years, year].sort((a, b) => b - a); // Add and sort descending
    });
  }
}
