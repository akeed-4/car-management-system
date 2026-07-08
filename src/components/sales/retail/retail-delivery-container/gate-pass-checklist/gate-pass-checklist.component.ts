import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { GatePassChecklistData } from '../../../../../models/retail/retail-delivery.model';

@Component({
  selector: 'app-gate-pass-checklist',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ],
  templateUrl: './gate-pass-checklist.component.html',
  styleUrls: ['./gate-pass-checklist.component.css']
})
export class GatePassChecklistComponent implements OnInit {
  @Output() checklistChange = new EventEmitter<GatePassChecklistData | null>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      gatePassSerial: ['', Validators.required],
      keysConfirmed: [false, Validators.requiredTrue],
      spareTireConfirmed: [false, Validators.requiredTrue],
      ownerManualConfirmed: [false],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.emitChange());
  }

  private emitChange(): void {
    this.checklistChange.emit(this.form.valid ? (this.form.value as GatePassChecklistData) : null);
  }
}
