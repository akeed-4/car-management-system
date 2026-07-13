import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { NotificationService } from '@/src/services/notification.service';

interface DialogData {
  userId: number;
  userName: string;
  currentRoleId: number | null;
}

@Component({
  selector: 'app-assign-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './assign-role-dialog.component.html',
  styleUrls: ['./assign-role-dialog.component.css']
})
export class AssignRoleDialogComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private dialogRef = inject(MatDialogRef<AssignRoleDialogComponent>);
  public data: DialogData = inject(MAT_DIALOG_DATA);

  roles = this.roleService.roles$;
  form: FormGroup;
  saving = signal(false);

  constructor() {
    this.form = this.fb.group({
      roleId: [this.data.currentRoleId, Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.userService.assignRole(this.data.userId, this.form.value.roleId).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.ROLE_ASSIGNED'));
        this.dialogRef.close(true);
      },
      error: err => {
        this.saving.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.ROLE_ASSIGN_FAILED'));
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
