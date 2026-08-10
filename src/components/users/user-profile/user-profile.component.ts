import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/AuthService.service';
import { NotificationService } from '@/src/services/notification.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';
import { MyProfile } from '../../../models/my-profile.model';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    AvatarComponent,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);

  profile = signal<MyProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  uploadingAvatar = signal(false);
  editMode = signal(false);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.email]],
    phoneNumber: [''],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.userService.getMyProfile().subscribe({
      next: profile => {
        this.profile.set(profile);
        this.form.patchValue({ email: profile.email ?? '', phoneNumber: profile.phoneNumber ?? '' });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('USERS.PROFILE.LOAD_ERROR'));
      }
    });
  }

  startEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const profile = this.profile();
    if (profile) {
      this.form.patchValue({ email: profile.email ?? '', phoneNumber: profile.phoneNumber ?? '' });
    }
    this.editMode.set(false);
  }

  save(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.userService.updateMyProfile(this.form.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.editMode.set(false);
        this.notificationService.showSuccess(this.translate.instant('USERS.PROFILE.SAVE_SUCCESS'));
        this.loadProfile();
      },
      error: err => {
        this.saving.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.PROFILE.SAVE_ERROR'));
      }
    });
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      this.notificationService.showError(this.translate.instant('USERS.PROFILE.AVATAR_INVALID_TYPE'));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      this.notificationService.showError(this.translate.instant('USERS.PROFILE.AVATAR_TOO_LARGE'));
      return;
    }

    this.uploadingAvatar.set(true);
    this.userService.uploadMyAvatar(file).subscribe({
      next: avatarUrl => {
        this.uploadingAvatar.set(false);
        this.profile.update(p => p ? { ...p, avatarUrl } : p);
        this.authService.updateCurrentUserAvatar(avatarUrl);
        this.notificationService.showSuccess(this.translate.instant('USERS.PROFILE.AVATAR_UPDATED'));
      },
      error: err => {
        this.uploadingAvatar.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.PROFILE.AVATAR_UPLOAD_ERROR'));
      }
    });
  }

  removeAvatar(): void {
    if (this.uploadingAvatar()) return;
    this.uploadingAvatar.set(true);
    this.userService.deleteMyAvatar().subscribe({
      next: () => {
        this.uploadingAvatar.set(false);
        this.profile.update(p => p ? { ...p, avatarUrl: null } : p);
        this.authService.updateCurrentUserAvatar(null);
        this.notificationService.showSuccess(this.translate.instant('USERS.PROFILE.AVATAR_REMOVED'));
      },
      error: err => {
        this.uploadingAvatar.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.PROFILE.AVATAR_REMOVE_ERROR'));
      }
    });
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, { width: '440px', panelClass: 'responsive-dialog-panel' });
  }
}
