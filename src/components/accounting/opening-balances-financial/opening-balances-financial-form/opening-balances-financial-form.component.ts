import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-opening-balances-financial-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './opening-balances-financial-form.component.html',
  styleUrls: ['./opening-balances-financial-form.component.css']
})
export class OpeningBalancesFinancialFormComponent implements OnInit {
  @Input() form: FormGroup;
  @Input() isEditing: boolean = false;
  @Input() currencies: string[] = [];
  @Input() accountTypes: string[] = [];
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(
    public translate: TranslateService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    if (!this.form) {
      this.form = this.fb.group({
        accountId: [null, Validators.required],
        accountName: ['', Validators.required],
        openingBalance: [0, [Validators.required, Validators.min(0)]],
        currency: ['', Validators.required],
        accountType: ['', Validators.required],
        entryDate: [new Date(), Validators.required],
        notes: ['']
      });
    }

    // Set default values if not provided
    if (!this.currencies || this.currencies.length === 0) {
      this.currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
    }

    if (!this.accountTypes || this.accountTypes.length === 0) {
      this.accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    }
  }

  get safeForm(): FormGroup {
    return this.form || this.fb.group({});
  }

  onSave() {
    this.save.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}