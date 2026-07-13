import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { NotificationService } from '@/src/services/notification.service';
import { User } from '../../../models/user.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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

  userForm!: FormGroup;
  editMode = signal(false);
  saving = signal(false);
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
      password: [''],
      roleId: [null, Validators.required],
      status: ['Active', Validators.required]
    });
  }

  saveUser() {
    if (!this.userForm.valid || this.saving()) {
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
