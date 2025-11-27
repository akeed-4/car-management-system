import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { ModalComponent } from '../shared/modal/modal.component';
import { User } from '../../types/user.model';
import { FormsModule } from '@angular/forms';

type SortColumn = keyof User | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [RouterLink, ModalComponent, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private router = inject(Router);

  users = this.userService.users$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');
  
  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);
  
  filteredAndSortedUsers = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let users = this.users();

    // Filter
    if (searchTerm) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.roleName.toLowerCase().includes(searchTerm) ||
        user.status.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      users = [...users].sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        }

        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return users;
  });

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filter.set(input.value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(currentDir => {
        if (currentDir === 'asc') return 'desc';
        if (currentDir === 'desc') return '';
        return 'asc';
      });
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    if (this.sortDirection() === 'asc') return '▲';
    if (this.sortDirection() === 'desc') return '▼';
    return '';
  }

  editUser(id: number): void {
    this.router.navigate(['/users/edit', id]);
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.userService.deleteUser(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}