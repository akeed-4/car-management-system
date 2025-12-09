import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StockTakeService } from '../../../services/stock-take.service';
import { StockTakeApprovalService } from '../../../services/stock-take-approval.service';
import { InventoryService } from '../../../services/inventory.service';
import { StockTake } from '../../../types/stock-take.model';
import { StockTakeApproval } from '../../../types/stock-take-approval.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-stock-taking-approval-form',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './stock-taking-approval-form.component.html',
  styleUrl: './stock-taking-approval-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingApprovalFormComponent {
  private router = inject(Router);
  private stockTakeService = inject(StockTakeService);
  private approvalService = inject(StockTakeApprovalService);
  private inventoryService = inject(InventoryService);

  // Form State
  approvalDate = signal(new Date().toISOString().split('T')[0]);
  approverName = signal('');
  selectedStockTakeId = signal<number | null>(null);

  // Data Sources
  private allStockTakes = toSignal(this.stockTakeService.getStockTakes(), { initialValue: [] });
  pendingStockTakes = computed(() => this.allStockTakes().filter(st => st.status === 'Pending'));
  
  selectedStockTake = signal<StockTake | null>(null);

  onStockTakeSelect(id: number | null): void {
    this.selectedStockTakeId.set(id);
    if (id) {
      this.stockTakeService.getStockTakeById(id).subscribe(stockTake => {
        this.selectedStockTake.set(stockTake ?? null);
      });
    } else {
      this.selectedStockTake.set(null);
    }
  }

  approveStockTake(): void {
    const stockTake = this.selectedStockTake();
    if (!stockTake || !this.approverName()) {
      alert('الرجاء إدخال اسم المعتمد واختيار مستند جرد.');
      return;
    }

    // 1. Update inventory quantities
    stockTake.items.forEach(item => {
      this.inventoryService.setCarQuantity(item.carId, item.countedQuantity);
    });

    // 2. Update stock take status to 'Approved'
    this.stockTakeService.updateStockTakeStatus(stockTake.id, 'Approved');

    // 3. Create and save the approval document
    const newApproval: Omit<StockTakeApproval, 'id'> = {
      date: this.approvalDate(),
      approverName: this.approverName(),
      stockTakeId: stockTake.id,
      stockTakeName: stockTake.name,
    };
    this.approvalService.addApproval(newApproval);

    alert(`تم اعتماد الجرد "${stockTake.name}" بنجاح وتحديث المخزون.`);
    this.router.navigate(['/inventory/stock-taking-approval']);
  }

  getDifference(countedQuantity: number, systemQuantity: number): number {
    return countedQuantity - systemQuantity;
  }
}