import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { StockTakeService } from '../../../services/stock-take.service';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { error } from 'console';

@Component({
  selector: 'app-stock-taking',
  standalone: true,
  imports: [
    RouterLink,
    ModalComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    DxDataGridModule,
    DxButtonModule
  ],
  templateUrl: './stock-taking.component.html',
  styleUrl: './stock-taking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingComponent {
  private stockTakeService = inject(StockTakeService);
  private router = inject(Router);

  stockTakes = toSignal(this.stockTakeService.getStockTakesByStore(1), { initialValue: [] });
constructor() {
  this.onDeleteClick=(this.onDeleteClick.bind(this));
  this.onEditClick=(this.onEditClick.bind(this));
}
  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  statusLookup = [
    { value: 'Pending', display: 'معلق' },
    { value: 'Approved', display: 'معتمد' }
  ];

  onEditClick = (e: any) => {
    this.editStockTake(e.row.data.id);
  };

  onDeleteClick = (e: any) => {
    this.requestDelete(e.row.data.id);
  };

  isEditVisible = (e: any) => {
    return e.row.data.status !== 'Approved';
  };

  isDeleteVisible = (e: any) => {
    return e.row.data.status !== 'Approved';
  };

  editStockTake(id: number) {
    this.router.navigate(['/inventory/stock-taking/edit', id]);
  }

  requestDelete(id: number) {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
      this.stockTakeService.deleteStockTake(id).subscribe(() => {
        // تحديث القائمة بعد الحذف
        this.stockTakes = toSignal(this.stockTakeService.getStockTakesByStore(1), { initialValue: [] });
      }, error=> {
        console.error('خطأ أثناء حذف الجرد:', error);
      }
      );
  }

  confirmDelete() {
    const id = this.itemToDeleteId();
    if (id) {
      this.stockTakeService.deleteStockTake(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}
