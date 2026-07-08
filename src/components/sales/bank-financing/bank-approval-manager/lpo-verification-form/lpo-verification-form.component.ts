import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';

export interface LpoVerificationData {
  lpoReference: string;
  approvedFinancingAmount: number;
  approvalDate: string;
}

@Component({
  selector: 'app-lpo-verification-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './lpo-verification-form.component.html',
  styleUrls: ['./lpo-verification-form.component.css']
})
export class LpoVerificationFormComponent implements OnInit, OnChanges {
  @Input() vehiclePrice = 0;
  @Output() lpoDataChange = new EventEmitter<LpoVerificationData | null>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      lpoReference: ['', Validators.required],
      approvedFinancingAmount: [0, [Validators.required, Validators.min(0.01)]],
      approvalDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.emitChange());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehiclePrice'] && !this.form.dirty) {
      this.form.patchValue({ approvedFinancingAmount: this.vehiclePrice }, { emitEvent: false });
      this.emitChange();
    }
  }

  private emitChange(): void {
    this.lpoDataChange.emit(this.form.valid ? (this.form.value as LpoVerificationData) : null);
  }
}
