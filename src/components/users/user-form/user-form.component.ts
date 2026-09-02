import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../services/permission.service';
import { User } from '../../../models/user.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/** Matches the backend's actual Identity password policy (ServiceCollectionExtensions.cs:
 *  RequireDigit=true, RequiredLength=6, everything else relaxed) -- Validators.minLength(6)
 *  alone let a 6-character all-letter password through the frontend only to be rejected server
 *  side with no client-visible reason why. */
function passwordPolicyValidator(): ValidatorFn {
  return (control): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // required (or its absence) is a separate validator's concern
    const errors: ValidationErrors = {};
    if (value.length < 6) errors['minLength'] = true;
    if (!/\d/.test(value)) errors['requiresDigit'] = true;
    return Object.keys(errors).length ? errors : null;
  };
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    TranslateModule
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private permissionService = inject(PermissionService);

  userForm!: FormGroup;
  editMode = signal(false);
  saving = signal(false);
  hidePassword = signal(true);

  canSaveUser = computed(() => this.editMode()
    ? this.permissionService.hasPermission('users.edit')
    : this.permissionService.hasPermission('users.create'));
  pageTitle = signal('USERS.FORM.ADD_TITLE');

  private editingUserId: number | null = null;

  roles = this.roleService.roles$;

  constructor() {
    this.initializeForm();

    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editingUserId = id;
        this.editMode.set(true);
        this.pageTitle.set('USERS.FORM.EDIT_TITLE');
        this.userForm.get('password')?.setValidators([passwordPolicyValidator()]);
        this.userForm.get('password')?.updateValueAndValidity();
        this.userService.getUserById(id).subscribe({
          next: existingUser => {
            const { password, ...userToEdit } = existingUser;
            this.userForm.patchValue(userToEdit);
          },
          error: error => {
            console.error('Error loading user:', error);
            this.notificationService.showError(this.translate.instant('USERS.ERRORS.LOAD_FAILED'));
            this.router.navigate(['/users']);
          }
        });
      }
    });
  }

  private initializeForm() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      // Required in create mode; the edit-mode branch below relaxes this to optional
      // (a blank password on edit means "keep the current one" -- see saveUser()).
      password: ['', [Validators.required, passwordPolicyValidator()]],
      roleId: [null, Validators.required],
      status: ['Active', Validators.required]
    });
  }

  saveUser() {
    if (this.saving()) return;

    if (!this.userForm.valid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.value;
    const role = this.roles().find(r => r.id === formValue.roleId);

    if (!role) {
      this.notificationService.showError(this.translate.instant('USERS.VALIDATION.ROLE_REQUIRED'));
      return;
    }

    this.saving.set(true);

    if (this.editMode() && this.editingUserId != null) {
      const userToSave: User = {
        ...formValue,
        id: this.editingUserId,
        roleName: role.name,
        isLocked: false,
        lockoutEnd: null
      };
      if (!userToSave.password) {
        delete userToSave.password;
      }
      this.userService.updateUser(userToSave).subscribe({
        next: () => {
          this.saving.set(false);
          this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.UPDATED'));
          this.router.navigate(['/users']);
        },
        error: err => {
          this.saving.set(false);
          this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.SAVE_FAILED'));
        }
      });
    } else {
      if (!formValue.password) {
        this.saving.set(false);
        this.notificationService.showError(this.translate.instant('USERS.VALIDATION.PASSWORD_REQUIRED'));
        return;
      }
      const newUser = { ...formValue, roleName: role.name };
      this.userService.addUser(newUser).subscribe({
        next: () => {
          this.saving.set(false);
          this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.CREATED'));
          this.router.navigate(['/users']);
        },
        error: err => {
          this.saving.set(false);
          this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.SAVE_FAILED'));
        }
      });
    }
  }
}
