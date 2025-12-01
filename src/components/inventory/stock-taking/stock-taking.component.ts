import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StockTakeService } from '../../../services/stock-take.service';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-stock-taking',
  standalone: true,
  imports: [RouterLink, DatePipe, ModalComponent],
  templateUrl: './stock-taking.component.html',
  styleUrl: './stock-taking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingComponent {
  private stockTakeService = inject(StockTakeService);
  private router = inject(Router);

  stockTakes = this.stockTakeService.stockTakes$;

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  editStockTake(id: number) {
    this.router.navigate(['/inventory/stock-taking/edit', id]);
  }

  requestDelete(id: number) {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
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
