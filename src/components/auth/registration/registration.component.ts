import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
    styleUrls: ['./registration.component.css'],
    standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatGridListModule,
    MatTableModule,
    MatDatepickerModule,
    MatDividerModule,
    DxDataGridModule,
    TranslateModule,]
})
export class RegistrationComponent {
  registrationForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService
  ) {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const { name, email, password, confirmPassword } = this.registrationForm.value;

      if (password !== confirmPassword) {
        this.errorMessage = this.translate.instant('REGISTRATION.PASSWORD_MISMATCH');
        return;
      }

      // Mock registration logic
      console.log('User registered:', { name, email });
      this.router.navigate(['/login']);
    } else {
      this.errorMessage = this.translate.instant('REGISTRATION.FILL_REQUIRED_FIELDS');
    }
  }
}