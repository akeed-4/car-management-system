import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../services/user.service';
import { NotificationService } from '@/src/services/notification.service';

interface DialogData {
  userId: number;
  userName: string;
}

@Component({
  selector: 'app-reset-password-dialog',
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
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.css']
})
export class ResetPasswordDialogComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);
  public data: DialogData = inject(MAT_DIALOG_DATA);

  form: FormGroup;
  saving = signal(false);
  hidePassword = signal(true);

  constructor() {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.userService.resetPassword(this.data.userId, this.form.value.newPassword).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.PASSWORD_RESET'));
        this.dialogRef.close(true);
      },
      error: err => {
        this.saving.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.PASSWORD_RESET_FAILED'));
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
