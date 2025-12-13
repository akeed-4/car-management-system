import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../../../types/branch.model';
import { StoreService } from '../../../services/store.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { StoreFormComponent } from '../store-form/store-form.component';

@Component({
  selector: 'app-store-list',
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
  templateUrl: './store-list.component.html',
  styleUrls: ['./store-list.component.css']
})
export class StoreListComponent {
  private storeService = inject(StoreService);
  private dialog = inject(MatDialog);

  stores = this.storeService.stores$;
  filter = signal('');
constructor(){
  this.onCreate=this.onCreate.bind(this);
  this.onDelete=this.onDelete.bind(this);
  this.onEdit=this.onEdit.bind(this);
}
  filteredStores = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const stores = this.stores();

    if (!searchTerm) {
      return stores;
    }

    return stores.filter(store =>
      store.name.en?.toLowerCase().includes(searchTerm) ||
      store.name.ar?.toLowerCase().includes(searchTerm) ||
      store.code?.toLowerCase().includes(searchTerm)
    );
  });

  loadStores(): void {
    this.storeService.getAll().subscribe({
      next: (data) => {
        // Signal is updated via tap in service
      },
      error: (error) => {
        console.error('Error loading stores:', error);
      }
    });
  }

  onCreate(): void {
    const dialogRef = this.dialog.open(StoreFormComponent, {
    width: '1400px',
      height: '80%',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStores();
      }
    });
  }

  onEdit(store: Store): void {
    const dialogRef = this.dialog.open(StoreFormComponent, {
      width: '800px',
      height: '60%',
      data: { store }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStores();
      }
    });
  }

  onDelete(store: Store): void {
    if (confirm(`Are you sure you want to delete store "${store.name.en}"?`)) {
      this.storeService.delete(store.id).subscribe({
        next: () => {
          this.loadStores();
        },
        error: (error) => {
          console.error('Error deleting store:', error);
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