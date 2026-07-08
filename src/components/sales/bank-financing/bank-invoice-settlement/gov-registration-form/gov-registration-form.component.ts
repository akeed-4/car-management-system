import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { GovRegistrationDetails } from '../../../../../models/bank-financing/bank-invoice.model';

@Component({
  selector: 'app-gov-registration-form',
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
  templateUrl: './gov-registration-form.component.html',
  styleUrls: ['./gov-registration-form.component.css']
})
export class GovRegistrationFormComponent implements OnInit {
  @Output() registrationChange = new EventEmitter<GovRegistrationDetails | null>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      licensePlateNumber: ['', Validators.required],
      registrationSequenceCode: ['', Validators.required],
      registrationDate: [new Date().toISOString().split('T')[0], Validators.required],
      issuingAuthority: ['']
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.emitChange());
  }

  private emitChange(): void {
    this.registrationChange.emit(this.form.valid ? (this.form.value as GovRegistrationDetails) : null);
  }
}
