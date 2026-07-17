import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RoleService } from '../../../services/role.service';
import { NotificationService } from '@/src/services/notification.service';
import { Role, RoleWithStats } from '../../../models/role.model';
import { RoleListPanelComponent } from './role-list-panel/role-list-panel.component';
import { PermissionPanelComponent } from './permission-panel/permission-panel.component';
import { countEnabledPermissions, permissionsEqual } from './role.utils';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    RoleListPanelComponent,
    PermissionPanelComponent
  ],
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
  rolesLoading = this.roleService.rolesLoading$;
  permissionsLoading = this.roleService.permissionsLoading$;
  usersCountByRole = this.roleService.usersCountByRole;

  selectedRoleId = signal<number | null>(null);
  currentPermissions = signal<{ [key: string]: boolean }>({});
  originalPermissionsSnapshot = signal<{ [key: string]: boolean }>({});
  newRoleName = signal('');

  savingPermissions = signal(false);
  creatingRole = signal(false);
  duplicatingRoleId = signal<number | null>(null);
  deletingRoleId = signal<number | null>(null);
  exportingRoleId = signal<number | null>(null);

  hasUnsavedChanges = computed(() =>
    this.selectedRoleId() !== null && !permissionsEqual(this.currentPermissions(), this.originalPermissionsSnapshot())
  );

  rolesWithStats = computed<RoleWithStats[]>(() =>
    this.roles().map(r => ({
      ...r,
      usersCount: this.usersCountByRole()[r.id] ?? 0,
      permissionsCount: countEnabledPermissions(r.permissions)
    }))
  );

  private findRole(roleId: number): Role | undefined {
    return this.roles().find(r => r.id === roleId);
  }

  private applyRoleSelection(roleId: number | null): void {
    this.selectedRoleId.set(roleId);
    const role = roleId ? this.findRole(roleId) : undefined;
    const permissions = role ? { ...role.permissions } : {};
    this.currentPermissions.set(permissions);
    this.originalPermissionsSnapshot.set({ ...permissions });
  }

  async onRoleSelect(roleId: number, opts: { force?: boolean } = {}): Promise<void> {
    if (roleId === this.selectedRoleId()) {
      return;
    }

    if (!opts.force && this.hasUnsavedChanges()) {
      const result = await this.notificationService.confirmWith2Options(
        this.translate.instant('ROLES.CONFIRM.UNSAVED_TITLE'),
        this.translate.instant('ROLES.CONFIRM.UNSAVED_MESSAGE'),
        this.translate.instant('ROLES.CONFIRM.SAVE_AND_SWITCH'),
        this.translate.instant('ROLES.CONFIRM.DISCARD_AND_SWITCH'),
        this.translate.instant('ROLES.CONFIRM.CANCEL')
      );

      if (result.isConfirmed) {
        await this.savePermissionsAsync();
        this.applyRoleSelection(roleId);
      } else if (result.isDenied) {
        this.applyRoleSelection(roleId);
      }
      return;
    }

    this.applyRoleSelection(roleId);
  }

  togglePermission(key: string): void {
    this.currentPermissions.update(p => ({ ...p, [key]: !p[key] }));
  }

  toggleGroup(event: { group: string; checked: boolean }): void {
    const group = this.permissionsList()[event.group];
    if (!group) return;
    const keys = Object.keys(group.permissions);
    this.currentPermissions.update(p => {
      const next = { ...p };
      for (const key of keys) {
        next[key] = event.checked;
      }
      return next;
    });
  }

  private savePermissionsAsync(): Promise<void> {
    const roleId = this.selectedRoleId();
    if (!roleId) return Promise.resolve();

    const permissionKeys = Object.entries(this.currentPermissions())
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    const snapshotToApply = { ...this.currentPermissions() };

    this.savingPermissions.set(true);
    return new Promise(resolve => {
      this.roleService.updateRolePermissions(roleId, null, permissionKeys).subscribe({
        next: () => {
          this.savingPermissions.set(false);
          this.originalPermissionsSnapshot.set(snapshotToApply);
          this.notificationService.showSuccess(this.translate.instant('ROLES.SUCCESS.PERMISSIONS_UPDATED'));
          resolve();
        },
        error: err => {
          this.savingPermissions.set(false);
          this.notificationService.showError(err?.error?.message || this.translate.instant('ROLES.ERRORS.UPDATE_FAILED'));
          resolve();
        }
      });
    });
  }

  savePermissions(): void {
    if (this.savingPermissions()) return;
    this.savePermissionsAsync();
  }

  discardChanges(): void {
    this.currentPermissions.set({ ...this.originalPermissionsSnapshot() });
  }

  onNewRoleNameChange(value: string): void {
    this.newRoleName.set(value);
  }

  createRole(): void {
    const name = this.newRoleName().trim();
    if (!name || this.creatingRole()) {
      return;
    }

    this.creatingRole.set(true);
    this.roleService.createRole(name, []).subscribe({
      next: newRole => {
        this.creatingRole.set(false);
        this.newRoleName.set('');
        this.notificationService.showSuccess(this.translate.instant('ROLES.SUCCESS.CREATED'));
        if (newRole?.id) {
          this.applyRoleSelection(newRole.id);
        }
      },
      error: err => {
        this.creatingRole.set(false);
        this.notificationService.showError(err?.error?.message || this.translate.instant('ROLES.ERRORS.CREATE_FAILED'));
      }
    });
  }

  async duplicateRole(role: RoleWithStats): Promise<void> {
    const result = await this.notificationService.confirmAlert(
      this.translate.instant('ROLES.CONFIRM.DUPLICATE_TITLE'),
      this.translate.instant('ROLES.CONFIRM.DUPLICATE_MESSAGE', { name: role.name })
    );
    if (!result.isConfirmed) return;

    const permissionKeys = Object.entries(role.permissions)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    this.duplicatingRoleId.set(role.id);
    this.roleService.createRole(`${role.name}${this.translate.instant('ROLES.DUPLICATE_SUFFIX')}`, permissionKeys).subscribe({
      next: newRole => {
        this.duplicatingRoleId.set(null);
        this.notificationService.showSuccess(this.translate.instant('ROLES.SUCCESS.DUPLICATED'));
        if (newRole?.id) {
          this.onRoleSelect(newRole.id, { force: true });
        }
      },
      error: err => {
        this.duplicatingRoleId.set(null);
        this.notificationService.showError(err?.error?.message || this.translate.instant('ROLES.ERRORS.DUPLICATE_FAILED'));
      }
    });
  }

  async deleteRole(role: RoleWithStats): Promise<void> {
    const result = await this.notificationService.confirmAlert(
      this.translate.instant('ROLES.CONFIRM.DELETE_TITLE'),
      this.translate.instant('ROLES.CONFIRM.DELETE_MESSAGE', { name: role.name, usersCount: role.usersCount })
    );
    if (!result.isConfirmed) return;

    this.deletingRoleId.set(role.id);
    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.deletingRoleId.set(null);
        this.notificationService.showSuccess(this.translate.instant('ROLES.SUCCESS.DELETED'));
        if (this.selectedRoleId() === role.id) {
          this.selectedRoleId.set(null);
          this.currentPermissions.set({});
          this.originalPermissionsSnapshot.set({});
        }
      },
      error: err => {
        this.deletingRoleId.set(null);
        this.notificationService.showError(err?.error?.message || this.translate.instant('ROLES.ERRORS.DELETE_FAILED'));
      }
    });
  }

  async exportRole(role: RoleWithStats): Promise<void> {
    this.exportingRoleId.set(role.id);
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(role.name);

      worksheet.columns = [
        { header: this.translate.instant('ROLES.EXPORT.GROUP'), key: 'group', width: 28 },
        { header: this.translate.instant('ROLES.EXPORT.PERMISSION'), key: 'permission', width: 40 },
        { header: this.translate.instant('ROLES.EXPORT.GRANTED'), key: 'granted', width: 14 }
      ];

      for (const group of Object.values(this.permissionsList())) {
        for (const [key, label] of Object.entries(group.permissions)) {
          worksheet.addRow({
            group: group.title,
            permission: label,
            granted: role.permissions[key]
              ? this.translate.instant('ROLES.EXPORT.YES')
              : this.translate.instant('ROLES.EXPORT.NO')
          });
        }
      }

      worksheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const { saveAs } = await import('file-saver');
      saveAs(new Blob([buffer]), `${role.name}_Permissions.xlsx`);
    } catch (err) {
      this.notificationService.showError(this.translate.instant('ROLES.ERRORS.EXPORT_FAILED'));
    } finally {
      this.exportingRoleId.set(null);
    }
  }
}
