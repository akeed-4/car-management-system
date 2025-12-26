import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StockTakeService } from '../../../services/stock-take.service';
import { StockTake } from '../../../types/stock-take.model';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';

@Component({
  selector: 'app-stock-taking-approval',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    DxDataGridModule,
    DxButtonModule
  ],
  templateUrl: './stock-taking-approval.component.html',
  styleUrl: './stock-taking-approval.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingApprovalComponent implements OnInit {
  private stockTakeService = inject(StockTakeService);
  private router = inject(Router);

  stockTakes = signal<StockTake[]>([]);

  ngOnInit() {
    this.loadStockTakes();
  }

  loadStockTakes() {
    this.stockTakeService.getStockTakesByStore(1).subscribe(result => {
      this.stockTakes.set(result);
    });
  }

  onEditClick(e: any)  {
    this.router.navigate(['/inventory/stock-taking-approval/edit', e.row.data.id]);
  };

  onViewClick (e: any){
    this.router.navigate(['/inventory/stock-taking-approval/view', e.row.data.id]);
  };
  onDeleteClick (e: any){
    // Implement delete functionality here
    const id = e.row && e.row.data ? e.row.data.id : null;
    if (id) {
      // Call the service to delete the stock take approval
      this.stockTakeService.deleteStockTake(id).subscribe(() => {
        alert('تم حذف اعتماد الجرد بنجاح.');
        this.loadStockTakes(); // Refresh the list after deletion
      });
    }
  }
}