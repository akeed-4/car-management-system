import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Branch } from '../../../types/branch.model';
import { BranchService } from '../../../services/branch.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { BranchFormComponent } from '../branch-form/branch-form.component';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormsModule,
    HasPermissionDirective
  ],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.css']
})
export class BranchListComponent {
  private branchService = inject(BranchService);
  private dialog = inject(MatDialog);

  branches = this.branchService.branches$;
  filter = signal('');

  filteredBranches = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const branches = this.branches();

    if (!searchTerm) {
      return branches;
    }

    return branches.filter(branch =>
      branch.name.en?.toLowerCase().includes(searchTerm) ||
      branch.name.ar?.toLowerCase().includes(searchTerm) ||
      branch.code?.toLowerCase().includes(searchTerm)
    );
  });

  loadBranches(): void {
    this.branchService.getAll().subscribe({
      next: (data) => {
        // Signal is updated via tap in service
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  onCreate(): void {
    const dialogRef = this.dialog.open(BranchFormComponent, {
      width: '1400px',
      height: '80%',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBranches();
      }
    });
  }

  onEdit(branch: Branch): void {
    const dialogRef = this.dialog.open(BranchFormComponent, {
      width: '1400px',
      height: '60%',
      data: { branch }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBranches();
      }
    });
  }

  onDelete(branch: Branch): void {
    if (confirm(`Are you sure you want to delete branch "${branch.name.en}"?`)) {
      this.branchService.delete(branch.id).subscribe({
        next: () => {
          this.loadBranches();
        },
        error: (error) => {
          console.error('Error deleting branch:', error);
        }
      });
    }
  }

  onRowClick(event: any): void {
    if (event.data) {
      this.onEdit(event.data);
    }
  }

  // Unit test: Test data loading, CRUD operations, permission checks
  // Storybook: Story for grid with different data states
}
