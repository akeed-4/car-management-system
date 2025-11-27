import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleService, PERMISSIONS_LIST } from '../../../services/role.service';
import { Role } from '../../../types/role.model';
import { KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, KeyValuePipe],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesComponent {
  private roleService = inject(RoleService);

  roles = this.roleService.roles$;
  permissionsList = PERMISSIONS_LIST;
  
  selectedRoleId = signal<number | null>(null);
  currentPermissions = signal<{ [key: string]: boolean }>({});
  newRoleName = signal('');
  
  // Convert object to array for @for loop
  permissionGroups = Object.entries(this.permissionsList);
  
  onRoleSelect(roleId: number | null): void {
    this.selectedRoleId.set(roleId);
    if (roleId) {
      const role = this.roles().find(r => r.id === roleId);
      this.currentPermissions.set(role ? { ...role.permissions } : {});
    } else {
      this.currentPermissions.set({});
    }
  }

  togglePermission(key: string): void {
    this.currentPermissions.update(p => ({ ...p, [key]: !p[key] }));
  }

  savePermissions(): void {
    const roleId = this.selectedRoleId();
    if (roleId) {
      const role = this.roles().find(r => r.id === roleId);
      if (role) {
        const updatedRole: Role = { ...role, permissions: this.currentPermissions() };
        this.roleService.updateRole(updatedRole);
        alert(`تم تحديث صلاحيات دور "${role.name}" بنجاح.`);
      }
    }
  }
  
  addNewRole(): void {
    const name = this.newRoleName().trim();
    if (name) {
      const newRole = this.roleService.addRole(name);
      this.onRoleSelect(newRole.id); // Select the new role for immediate editing
      this.newRoleName.set('');
    }
  }

  getRoleName(roleId: number): string {
    return this.roles().find(r => r.id === roleId)?.name || '';
  }
}
