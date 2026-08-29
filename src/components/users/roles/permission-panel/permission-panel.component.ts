import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionsList } from '../../../../services/role.service';
import { splitLabel } from '../role.utils';
import { PermissionService } from '../../../../services/permission.service';

type FilterMode = 'all' | 'selected' | 'unselected' | 'modified';

interface FilteredPermissionEntry {
  key: string;
  label: string;
}

interface FilteredGroup {
  key: string;
  title: string;
  allKeys: string[];
  entries: FilteredPermissionEntry[];
}

@Component({
  selector: 'app-permission-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './permission-panel.component.html',
  styleUrl: './permission-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionPanelComponent {
  private permissionService = inject(PermissionService);

  /** Whether the current user may edit role permissions at all -- read-only view otherwise. */
  canManage = computed(() => this.permissionService.hasPermission('users.roles.manage'));

  permissionsList = input.required<PermissionsList>();
  currentPermissions = input.required<{ [key: string]: boolean }>();
  originalPermissions = input.required<{ [key: string]: boolean }>();
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  saving = input<boolean>(false);
  hasUnsavedChanges = input<boolean>(false);

  /** User Permissions screen reuse: permission.key -> role name(s) granting it. When provided,
   *  each granted permission shows "Granted by: RoleA, RoleB" instead of being freely toggleable --
   *  this system has no direct per-user permission grant, every one traces back to a role (see
   *  UserEffectivePermissionDto on the backend). Null/omitted (the Roles screen's own usage)
   *  changes nothing about existing behavior. */
  attributionByKey = input<{ [key: string]: string[] } | null>(null);
  /** Forces the checkboxes read-only and hides the Save/Discard bar regardless of canManage() --
   *  the User Permissions screen displays effective permissions for information only; editing
   *  happens by changing the user's roles, not by toggling permissions here directly. */
  readOnlyMode = input<boolean>(false);

  /** Single place both the checkbox [disabled] bindings and the save-bar visibility read from. */
  isReadOnly = computed(() => this.readOnlyMode() || !this.canManage());

  permissionToggle = output<string>();
  groupToggle = output<{ group: string; checked: boolean }>();
  save = output<void>();
  discard = output<void>();

  permissionSearchTerm = signal('');
  filterMode = signal<FilterMode>('all');

  skeletonGroups = [1, 2, 3];

  filteredGroups = computed<FilteredGroup[]>(() => {
    const term = this.permissionSearchTerm().trim().toLowerCase();
    const mode = this.filterMode();
    const current = this.currentPermissions();
    const original = this.originalPermissions();

    const groups: FilteredGroup[] = [];
    for (const [groupKey, group] of Object.entries(this.permissionsList())) {
      const allKeys = Object.keys(group.permissions);
      const entries: FilteredPermissionEntry[] = [];

      for (const key of allKeys) {
        const label = group.permissions[key];
        if (term && !label.toLowerCase().includes(term) && !key.toLowerCase().includes(term)) {
          continue;
        }
        if (mode === 'selected' && !current[key]) continue;
        if (mode === 'unselected' && current[key]) continue;
        if (mode === 'modified' && !!current[key] === !!original[key]) continue;

        entries.push({ key, label });
      }

      if (entries.length > 0) {
        groups.push({ key: groupKey, title: group.title, allKeys, entries });
      }
    }
    return groups;
  });

  isChecked(key: string): boolean {
    return !!this.currentPermissions()[key];
  }

  attributionFor(key: string): string[] {
    return this.attributionByKey()?.[key] ?? [];
  }

  isModified(key: string): boolean {
    return !!this.currentPermissions()[key] !== !!this.originalPermissions()[key];
  }

  getGroupState(allKeys: string[]): 'all' | 'none' | 'partial' {
    const current = this.currentPermissions();
    const checkedCount = allKeys.filter(k => current[k]).length;
    if (checkedCount === 0) return 'none';
    if (checkedCount === allKeys.length) return 'all';
    return 'partial';
  }

  splitLabel(label: string): { pre: string; match: string; post: string } {
    return splitLabel(label, this.permissionSearchTerm());
  }

  trackByGroupKey(_index: number, group: FilteredGroup): string {
    return group.key;
  }

  trackByPermissionKey(_index: number, entry: FilteredPermissionEntry): string {
    return entry.key;
  }
}
