import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/AuthService.service';
import { TenantContextService } from '../../../services/tenant-context.service';
import { NotificationService } from '@/src/services/notification.service';

/** Self-service "change my own password" -- distinct from ResetPasswordDialogComponent (an admin
 *  resetting someone else's password, no current-password check). On success the backend revokes
 *  every outstanding session for this user, so this dialog always ends in a forced logout +
 *  redirect to /login, never keeping the current session alive. */
@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.css'
})
export class ChangePasswordDialogComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private tenantContext = inject(TenantContextService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);

  form: FormGroup;
  saving = signal(false);
  hideCurrentPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);

  constructor() {
    this.form = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: [passwordsMatchValidator] });
  }

  submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { currentPassword, newPassword } = this.form.value;
    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => this.onChangedSuccessfully(),
      error: err => {
        this.saving.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.CHANGE_PASSWORD.ERROR'));
      }
    });
  }

  private onChangedSuccessfully(): void {
    this.notificationService.showSuccess(this.translate.instant('USERS.CHANGE_PASSWORD.SUCCESS_RELOGIN'));
    this.dialogRef.close(true);

    // The backend already revoked every outstanding session for this user -- the current tokens
    // are dead server-side, so there is no "keep the session active" option here; log out locally
    // and send the user back to /login to sign in with the new password.
    this.authService.logout();
    this.tenantContext.clear();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (!newPassword || !confirmPassword) return null;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}
