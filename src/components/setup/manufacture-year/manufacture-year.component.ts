import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ManufactureYearService } from '../../../services/manufacture-year.service';

@Component({
  selector: 'app-manufacture-year',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './manufacture-year.component.html',
  styleUrl: './manufacture-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManufactureYearComponent {
  private yearService = inject(ManufactureYearService);

  years = this.yearService.years$;
  newYear = signal<number | null>(new Date().getFullYear());

  addYear(): void {
    const year = this.newYear();
    if (year && year > 1900 && year < 2100) {
      this.yearService.addYear(year);
      this.newYear.set(new Date().getFullYear());
    }
  }
}