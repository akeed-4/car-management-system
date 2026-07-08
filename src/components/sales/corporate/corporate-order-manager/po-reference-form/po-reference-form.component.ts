import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { POReferenceData } from '../../../../../models/corporate/corporate-order.model';

@Component({
  selector: 'app-po-reference-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './po-reference-form.component.html',
  styleUrls: ['./po-reference-form.component.css']
})
export class PoReferenceFormComponent implements OnInit {
  @Output() poDataChange = new EventEmitter<POReferenceData | null>();

  form: FormGroup;
  contractTerms: POReferenceData['contractTerm'][] = ['Net 30', 'Net 60'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      purchaseOrderReference: ['', Validators.required],
      contractTerm: ['Net 30', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.emitChange());
  }

  private emitChange(): void {
    this.poDataChange.emit(this.form.valid ? (this.form.value as POReferenceData) : null);
  }
}
