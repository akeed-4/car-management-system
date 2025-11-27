import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { User } from '../../../types/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private roleService = inject(RoleService);

  user = signal<Partial<User>>({ status: 'Active' });
  editMode = signal(false);
  pageTitle = signal('إضافة مستخدم جديد');
  
  roles = this.roleService.roles$;

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات المستخدم');
        const existingUser = this.userService.getUserById(id);
        if (existingUser) {
          // Exclude password when setting the form model
          const { password, ...userToEdit } = existingUser;
          this.user.set({ ...userToEdit });
        } else {
          this.router.navigate(['/users']);
        }
      }
    });
  }
  
  updateUserField<K extends keyof User>(field: K, value: User[K]) {
    this.user.update(u => ({ ...u, [field]: value }));
  }

  saveUser() {
    const userData = this.user();
    const role = this.roles().find(r => r.id === userData.roleId);

    if (!role) {
      alert('الرجاء اختيار دور صحيح.');
      return;
    }

    const userToSave = { ...userData, roleName: role.name };

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
