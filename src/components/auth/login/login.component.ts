import { CommonModule } from '@angular/common';
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
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { AuthService } from '../../../services/AuthService.service';
import { login } from './login.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
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
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
      private translate: TranslateService,
    private authService: AuthService 
  ) {
    this.loginForm = this.fb.group({
      name: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

 onSubmit(): void {
  if (this.loginForm.valid) {
      const login: login = this.loginForm.value;
        this.router.navigate(['/dashboard']);
    this.authService.login(login).subscribe(
      () => {
        // Navigate to dashboard after successful login so the LayoutComponent
        // wrapper is used and the dashboard shows with the app layout.
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        console.log(error)
        this.errorMessage = this.translate.instant('LOGIN.INVALID_CREDENTIALS');
      }
    );
  } else {
    this.errorMessage = this.translate.instant('LOGIN.FILL_REQUIRED_FIELDS');
  }
}
}