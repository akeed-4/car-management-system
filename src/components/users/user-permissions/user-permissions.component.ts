import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../services/permission.service';
import { Role } from '../../../models/role.model';
import { UserListPanelComponent } from './user-list-panel/user-list-panel.component';
import { PermissionPanelComponent } from '../roles/permission-panel/permission-panel.component';

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    TranslateModule,
    UserListPanelComponent,
    PermissionPanelComponent
  ],
  templateUrl: './user-permissions.component.html',
  styleUrl: './user-permissions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPermissionsComponent {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private notificationService = inject(NotificationService);
  private permissionService = inject(PermissionService);
  private translate = inject(TranslateService);

  users = this.userService.users$;
  usersLoading = this.userService.usersLoading$;
  roles = this.roleService.roles$;
  rolesLoading = this.roleService.rolesLoading$;
  permissionsList = this.roleService.permissionsList$;

  canManageRoles = computed(() => this.permissionService.hasPermission('users.assignrole'));

  selectedUserId = signal<number | null>(null);
  currentRoleIds = signal<number[]>([]);
  originalRoleIds = signal<number[]>([]);
  rolesLoadingForUser = signal(false);
  savingRoles = signal(false);

  selectedUser = computed(() => this.users().find(u => u.id === this.selectedUserId()) ?? null);

  hasUnsavedChanges = computed(() => {
    if (this.selectedUserId() === null) return false;
    return !this.sameIds(this.currentRoleIds(), this.originalRoleIds());
  });

  /** Effective permissions for the roles currently selected in the checklist (including unsaved
   *  edits) -- computed client-side from RoleService.roles(), the same Role -> permissions data
   *  the backend's GetUserEffectivePermissionsAsync draws from, so a role toggle previews its
   *  effect immediately without a round trip. */
  private currentPreview = computed(() => {
    const ids = new Set(this.currentRoleIds());
    return this.buildPermissionPreview(ids);
  });

  /** Same computation against the last-saved role set, used as the permission panel's
   *  "original" state so pending role changes highlight as modified. */
  private originalPreview = computed(() => {
    const ids = new Set(this.originalRoleIds());
    return this.buildPermissionPreview(ids);
  });

  currentPermissions = computed(() => this.currentPreview().map);
  originalPermissions = computed(() => this.originalPreview().map);
  attributionByKey = computed(() => this.currentPreview().attribution);

  private buildPermissionPreview(roleIds: Set<number>): { map: { [key: string]: boolean }; attribution: { [key: string]: string[] } } {
    const map: { [key: string]: boolean } = {};
    const attribution: { [key: string]: string[] } = {};
    for (const role of this.roles()) {
      if (!roleIds.has(role.id)) continue;
      for (const [key, granted] of Object.entries(role.permissions)) {
        if (!granted) continue;
        map[key] = true;
        (attribution[key] ??= []).push(role.name);
      }
    }
    return { map, attribution };
  }

  private sameIds(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const setB = new Set(b);
    return a.every(id => setB.has(id));
  }

  isRoleChecked(roleId: number): boolean {
    return this.currentRoleIds().includes(roleId);
  }

  toggleRole(role: Role): void {
    this.currentRoleIds.update(ids =>
      ids.includes(role.id) ? ids.filter(id => id !== role.id) : [...ids, role.id]
    );
  }

  private loadRolesForUser(userId: number): void {
    this.rolesLoadingForUser.set(true);
    this.userService.getUserRoles(userId).subscribe({
      next: roleSummaries => {
        const ids = roleSummaries.map(r => r.id);
        this.currentRoleIds.set(ids);
        this.originalRoleIds.set(ids);
        this.rolesLoadingForUser.set(false);
      },
      error: () => {
        this.rolesLoadingForUser.set(false);
        this.notificationService.showError(this.translate.instant('USERS.PERMISSIONS.ERRORS.LOAD_ROLES_FAILED'));
      }
    });
  }

  private applyUserSelection(userId: number | null): void {
    this.selectedUserId.set(userId);
    if (userId === null) {
      this.currentRoleIds.set([]);
      this.originalRoleIds.set([]);
      return;
    }
    this.loadRolesForUser(userId);
  }

  async onUserSelect(userId: number): Promise<void> {
    if (userId === this.selectedUserId()) {
      return;
    }

    if (this.hasUnsavedChanges()) {
      const result = await this.notificationService.confirmWith2Options(
        this.translate.instant('USERS.PERMISSIONS.CONFIRM.UNSAVED_TITLE'),
        this.translate.instant('USERS.PERMISSIONS.CONFIRM.UNSAVED_MESSAGE'),
        this.translate.instant('USERS.PERMISSIONS.CONFIRM.SAVE_AND_SWITCH'),
        this.translate.instant('USERS.PERMISSIONS.CONFIRM.DISCARD_AND_SWITCH'),
        this.translate.instant('USERS.PERMISSIONS.CONFIRM.CANCEL')
      );

      if (result.isConfirmed) {
        await this.saveRolesAsync();
        this.applyUserSelection(userId);
      } else if (result.isDenied) {
        this.applyUserSelection(userId);
      }
      return;
    }

    this.applyUserSelection(userId);
  }

  private saveRolesAsync(): Promise<void> {
    const userId = this.selectedUserId();
    if (!userId) return Promise.resolve();

    const current = new Set(this.currentRoleIds());
    const original = new Set(this.originalRoleIds());
    const toAdd = [...current].filter(id => !original.has(id));
    const toRemove = [...original].filter(id => !current.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      return Promise.resolve();
    }

    this.savingRoles.set(true);
    const requests = [
      ...toAdd.map(roleId => this.userService.addUserRole(userId, roleId)),
      ...toRemove.map(roleId => this.userService.removeUserRole(userId, roleId))
    ];

    return new Promise(resolve => {
      let remaining = requests.length;
      let failed = false;

      const finish = () => {
        this.savingRoles.set(false);
        if (failed) {
          this.loadRolesForUser(userId);
        } else {
          this.originalRoleIds.set([...this.currentRoleIds()]);
          this.notificationService.showSuccess(this.translate.instant('USERS.PERMISSIONS.SUCCESS.ROLES_UPDATED'));
        }
        resolve();
      };

      for (const request of requests) {
        request.subscribe({
          next: () => {
            remaining--;
            if (remaining === 0) finish();
          },
          error: err => {
            failed = true;
            remaining--;
            this.notificationService.showError(err?.error || this.translate.instant('USERS.PERMISSIONS.ERRORS.UPDATE_ROLES_FAILED'));
            if (remaining === 0) finish();
          }
        });
      }
    });
  }

  saveRoles(): void {
    if (this.savingRoles()) return;
    this.saveRolesAsync();
  }

  discardChanges(): void {
    this.currentRoleIds.set([...this.originalRoleIds()]);
  }
}
