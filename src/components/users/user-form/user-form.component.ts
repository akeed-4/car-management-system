import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { User } from '../../../types/user.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

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
  private fb = inject(FormBuilder);

  userForm!: FormGroup;
  editMode = signal(false);
  pageTitle = signal('إضافة مستخدم جديد');

  roles = this.roleService.roles$;

  constructor() {
    this.initializeForm();

    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات المستخدم');
        this.userService.getUserById(id).subscribe(existingUser => {
          // Exclude password when setting the form model
          const { password, ...userToEdit } = existingUser;
          this.userForm.patchValue(userToEdit);
        }, error => {
          console.error('Error loading user:', error);
          this.router.navigate(['/users']);
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
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const role = this.roles().find(r => r.id === formValue.roleId);

      if (!role) {
        alert('الرجاء اختيار دور صحيح.');
        return;
      }

      const userToSave = { ...formValue, roleName: role.name };

      if (this.editMode()) {
        // In a real app, password should only be updated if a new one is entered.
        // This is a simplified version.
        this.userService.updateUser(userToSave as User);
      } else {
        if (!userToSave.password) {
          alert('الرجاء إدخال كلمة المرور.');
          return;
        }
        const { id, ...newUser } = userToSave;
        this.userService.addUser(newUser as Omit<User, 'id'>);
      }
      this.router.navigate(['/users']);
    }
  }
}
