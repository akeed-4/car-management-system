import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../services/role.service';
import { NotificationService } from '@/src/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { Role } from '../../../models/role.model';
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
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  roles = this.roleService.roles$;
  permissionsList = this.roleService.permissionsList$;

  selectedRoleId = signal<number | null>(null);
  currentPermissions = signal<{ [key: string]: boolean }>({});
  newRoleName = signal('');
  saving = signal(false);

  permissionGroups = computed(() => Object.entries(this.permissionsList()));

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
    if (!roleId || this.saving()) {
      return;
    }

    const role = this.roles().find(r => r.id === roleId);
    if (!role) {
      return;
    }

    const permissionKeys = Object.entries(this.currentPermissions())
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    this.saving.set(true);
    this.roleService.updateRolePermissions(roleId, null, permissionKeys).subscribe({
      next: () => {
        this.saving.set(false);
        this.notificationService.showSuccess(this.translate.instant('ROLES.SUCCESS.PERMISSIONS_UPDATED'));
      },
      error: err => {
        this.saving.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('ROLES.ERRORS.UPDATE_FAILED'));
      }
    });
  }

  addNewRole(): void {
    const name = this.newRoleName().trim();
    if (!name || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.roleService.createRole(name, []).subscribe({
      next: newRole => {
        this.saving.set(false);
        this.newRoleName.set('');
        this.notificationService.showSuccess(this.translate.instant('ROLES.SUCCESS.CREATED'));
        if (newRole?.id) {
          this.onRoleSelect(newRole.id);
        }
      },
      error: err => {
        this.saving.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('ROLES.ERRORS.CREATE_FAILED'));
      }
    });
  }

  getSelectedRoleName(): string {
    const roleId = this.selectedRoleId();
    if (!roleId) return '';
    const role = this.roles().find(r => r.id === roleId);
    return role?.name || '';
  }
}
