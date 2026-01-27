import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { InfoBankService } from '../../../services/info-bank.service';
import { InfoBank } from '../../../models/info-bank.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-bank-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './bank-form.component.html',
  styleUrls: ['./bank-form.component.css']
})
export class BankFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private infoBankService = inject(InfoBankService);

  form: FormGroup;
  isEdit = false;
  infoBankId: number | null = null;

  currencies = ['USD', 'EUR', 'EGP', 'SAR']; // Example currencies

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      accountNumber: ['', Validators.required],
      branch: ['', Validators.required],
      swiftCode: [''],
      iban: [''],
      currency: ['EGP', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.infoBankId = +id;
        this.loadInfoBank(this.infoBankId);
      }
    });
  }

  loadInfoBank(id: number) {
    this.infoBankService.getInfoBank(id).subscribe(infoBank => {
      this.form.patchValue(infoBank);
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const infoBank: InfoBank = this.form.value;
      if (this.isEdit && this.infoBankId) {
        this.infoBankService.updateInfoBank(this.infoBankId, infoBank).subscribe(() => {
          this.router.navigate(['/bank/list']);
        });
      } else {
        this.infoBankService.createInfoBank(infoBank).subscribe(() => {
          this.router.navigate(['/bank/list']);
        });
      }
    }
  }

  onCancel() {
    this.router.navigate(['/bank/list']);
  }
}