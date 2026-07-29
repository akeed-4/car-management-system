import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../services/permission.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';
import { AssignRoleDialogComponent } from '../assign-role-dialog/assign-role-dialog.component';
import { User } from '../../../models/user.model';

type ConfirmActionType = 'delete' | 'activate' | 'deactivate' | 'lock' | 'unlock';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    DxDataGridModule,
    TranslateModule,
    ModalComponent,
    HasPermissionDirective
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private notificationService = inject(NotificationService);
  private permissionService = inject(PermissionService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  public translate = inject(TranslateService);

  users = this.userService.users$;
  roles = this.roleService.roles$;

  // Toolbar filters -- applied on top of DevExtreme's own filter-row/search-panel, not a
  // replacement for them. Both operate on the already-loaded users() array (no backend
  // query params exist for search/filter/pagination on this endpoint).
  statusFilter = signal<'All' | 'Active' | 'Inactive'>('All');
  roleFilter = signal<number | 'All'>('All');

  filteredUsers = computed(() => {
    const status = this.statusFilter();
    const roleId = this.roleFilter();
    return this.users().filter(u =>
      (status === 'All' || u.status === status) &&
      (roleId === 'All' || u.roleId === roleId)
    );
  });

  // Confirmation modal state
  isConfirmModalOpen = signal(false);
  confirmModalTitle = signal('');
  confirmModalMessage = signal('');
  private pendingAction: ConfirmActionType | null = null;
  private pendingUser: User | null = null;

  constructor() {
    this.editClick = this.editClick.bind(this);
    this.deleteClick = this.deleteClick.bind(this);
    this.activateClick = this.activateClick.bind(this);
    this.deactivateClick = this.deactivateClick.bind(this);
    this.lockClick = this.lockClick.bind(this);
    this.unlockClick = this.unlockClick.bind(this);
    this.resetPasswordClick = this.resetPasswordClick.bind(this);
    this.assignRoleClick = this.assignRoleClick.bind(this);
    this.canShowEdit = this.canShowEdit.bind(this);
    this.canShowAssignRole = this.canShowAssignRole.bind(this);
    this.canShowResetPassword = this.canShowResetPassword.bind(this);
    this.canShowDeactivate = this.canShowDeactivate.bind(this);
    this.canShowActivate = this.canShowActivate.bind(this);
    this.canShowLock = this.canShowLock.bind(this);
    this.canShowUnlock = this.canShowUnlock.bind(this);
    this.canShowDelete = this.canShowDelete.bind(this);
  }

  canShowEdit(): boolean {
    return this.permissionService.hasPermission('users.edit');
  }

  canShowAssignRole(): boolean {
    return this.permissionService.hasPermission('users.assignrole');
  }

  canShowResetPassword(): boolean {
    return this.permissionService.hasPermission('users.resetpassword');
  }

  canShowDeactivate(e: any): boolean {
    return e.row?.data?.status === 'Active' && this.permissionService.hasPermission('users.activate');
  }

  canShowActivate(e: any): boolean {
    return e.row?.data?.status !== 'Active' && this.permissionService.hasPermission('users.activate');
  }

  canShowLock(e: any): boolean {
    return !e.row?.data?.isLocked && this.permissionService.hasPermission('users.lock');
  }

  canShowUnlock(e: any): boolean {
    return !!e.row?.data?.isLocked && this.permissionService.hasPermission('users.lock');
  }

  canShowDelete(): boolean {
    return this.permissionService.hasPermission('users.delete');
  }

  ngOnInit(): void {
    this.userService.loadUsers();
  }

  createUser(): void {
    this.router.navigate(['/users/new']);
  }

  editUser(id: number): void {
    this.router.navigate(['/users/edit', id]);
  }

  editClick(e: any): void {
    this.editUser(e.row.data.id);
  }

  deleteClick(e: any): void {
    this.requestConfirmation('delete', e.row.data);
  }

  activateClick(e: any): void {
    this.requestConfirmation('activate', e.row.data);
  }

  deactivateClick(e: any): void {
    this.requestConfirmation('deactivate', e.row.data);
  }

  lockClick(e: any): void {
    this.requestConfirmation('lock', e.row.data);
  }

  unlockClick(e: any): void {
    this.requestConfirmation('unlock', e.row.data);
  }

  resetPasswordClick(e: any): void {
    const user: User = e.row.data;
    this.dialog.open(ResetPasswordDialogComponent, {
      width: '420px',
      data: { userId: user.id, userName: user.name }
    });
  }

  assignRoleClick(e: any): void {
    const user: User = e.row.data;
    this.dialog.open(AssignRoleDialogComponent, {
      width: '420px',
      data: { userId: user.id, userName: user.name, currentRoleId: user.roleId || null }
    });
  }

  private requestConfirmation(action: ConfirmActionType, user: User): void {
    this.pendingAction = action;
    this.pendingUser = user;

    const titleKey = `USERS.CONFIRM.${action.toUpperCase()}_TITLE`;
    const messageKey = `USERS.CONFIRM.${action.toUpperCase()}_MESSAGE`;
    this.confirmModalTitle.set(this.translate.instant(titleKey));
    this.confirmModalMessage.set(this.translate.instant(messageKey, { name: user.name }));
    this.isConfirmModalOpen.set(true);
  }

  onConfirmAction(): void {
    const action = this.pendingAction;
    const user = this.pendingUser;
    this.closeConfirmModal();

    if (!action || !user) {
      return;
    }

    switch (action) {
      case 'delete':
        this.userService.deleteUser(user.id).subscribe({
          next: () => this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.DELETED')),
          error: err => this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.DELETE_FAILED'))
        });
        break;
      case 'activate':
        this.userService.activateUser(user.id).subscribe({
          next: () => this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.ACTIVATED')),
          error: err => this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.ACTION_FAILED'))
        });
        break;
      case 'deactivate':
        this.userService.deactivateUser(user.id).subscribe({
          next: () => this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.DEACTIVATED')),
          error: err => this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.ACTION_FAILED'))
        });
        break;
      case 'lock':
        this.userService.lockUser(user.id).subscribe({
          next: () => this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.LOCKED')),
          error: err => this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.ACTION_FAILED'))
        });
        break;
      case 'unlock':
        this.userService.unlockUser(user.id).subscribe({
          next: () => this.notificationService.showSuccess(this.translate.instant('USERS.SUCCESS.UNLOCKED')),
          error: err => this.notificationService.showError(err?.error?.message || this.translate.instant('USERS.ERRORS.ACTION_FAILED'))
        });
        break;
    }
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen.set(false);
    this.pendingAction = null;
    this.pendingUser = null;
  }

  getStatusColor(status: string): string {
    return status === 'Active' ? 'success' : 'default';
  }
}
