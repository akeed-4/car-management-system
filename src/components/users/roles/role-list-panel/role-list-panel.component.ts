import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { RoleWithStats } from '../../../../models/role.model';
import { HasPermissionDirective } from '../../../shared/permission.directive';

@Component({
  selector: 'app-role-list-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    HasPermissionDirective
  ],
  templateUrl: './role-list-panel.component.html',
  styleUrl: './role-list-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleListPanelComponent {
  roles = input.required<RoleWithStats[]>();
  selectedRoleId = input<number | null>(null);
  loading = input<boolean>(false);
  newRoleName = input<string>('');
  creatingRole = input<boolean>(false);
  duplicatingRoleId = input<number | null>(null);
  deletingRoleId = input<number | null>(null);
  exportingRoleId = input<number | null>(null);

  roleSelect = output<number>();
  createRole = output<void>();
  duplicateRole = output<RoleWithStats>();
  deleteRole = output<RoleWithStats>();
  exportRole = output<RoleWithStats>();
  newRoleNameChange = output<string>();

  roleSearchTerm = signal('');

  filteredRoles = computed(() => {
    const term = this.roleSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.roles();
    }
    return this.roles().filter(r => r.name.toLowerCase().includes(term));
  });

  skeletonRows = [1, 2, 3, 4, 5];

  trackByRoleId(_index: number, role: RoleWithStats): number {
    return role.id;
  }
}
