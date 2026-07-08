import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { RetailCustomerInfo } from '../../../../../models/retail/retail-quotation.model';

@Component({
  selector: 'app-customer-info-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, TranslateModule],
  templateUrl: './customer-info-form.component.html',
  styleUrls: ['./customer-info-form.component.css']
})
export class CustomerInfoFormComponent implements OnChanges {
  @Input() value: RetailCustomerInfo | null = null;
  @Output() customerChange = new EventEmitter<RetailCustomerInfo | null>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{7,15}$/)]],
      nationalId: ['', Validators.required]
    });

    this.form.valueChanges.subscribe(() => this.emitChange());
  }

  ngOnChanges(): void {
    if (this.value) {
      this.form.patchValue(this.value, { emitEvent: false });
    }
  }

  private emitChange(): void {
    this.customerChange.emit(this.form.valid ? (this.form.value as RetailCustomerInfo) : null);
  }
}
