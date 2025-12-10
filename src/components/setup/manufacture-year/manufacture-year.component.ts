import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ManufactureYearService } from '../../../services/manufacture-year.service';
import { CurrentSettingService } from '../../../services/current-setting.service';

@Component({
  selector: 'app-manufacture-year',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatGridListModule, MatIconModule, TranslateModule],
  templateUrl: './manufacture-year.component.html',
  styleUrl: './manufacture-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManufactureYearComponent implements OnInit {
  private yearService = inject(ManufactureYearService);
  private currentSettingService = inject(CurrentSettingService);
  private fb = inject(FormBuilder);

  years = this.yearService.years$;
  yearForm!: FormGroup;
  cardLayout$ = this.currentSettingService.getCardLayout(1);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.yearForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]]
    });
  }
  addYear(): void {
    if (this.yearForm.valid) {
      const year = this.yearForm.value.year;
      if (year && year > 1900 && year < 2100) {
        this.yearService.addYear(year);
        this.yearForm.reset({ year: new Date().getFullYear() });
      }
    }
  }
}