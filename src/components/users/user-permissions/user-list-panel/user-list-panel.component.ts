import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-user-list-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './user-list-panel.component.html',
  styleUrl: './user-list-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListPanelComponent {
  users = input.required<User[]>();
  selectedUserId = input<number | null>(null);
  loading = input<boolean>(false);

  userSelect = output<number>();

  userSearchTerm = signal('');

  filteredUsers = computed(() => {
    const term = this.userSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.users();
    }
    return this.users().filter(u =>
      u.name.toLowerCase().includes(term) || u.roleName?.toLowerCase().includes(term)
    );
  });

  skeletonRows = [1, 2, 3, 4, 5];

  trackByUserId(_index: number, user: User): number {
    return user.id;
  }
}
