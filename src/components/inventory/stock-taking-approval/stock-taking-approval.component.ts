import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { StockTakeApprovalService } from '../../../services/stock-take-approval.service';
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
export class StockTakingApprovalComponent {
  private approvalService = inject(StockTakeApprovalService);
  private router = inject(Router);

  approvals = toSignal(this.approvalService.getApprovals(), { initialValue: [] });

  onEditClick = (e: any) => {
    this.router.navigate(['/inventory/stock-taking-approval/edit', e.row.data.id]);
  };

  onViewClick = (e: any) => {
    this.router.navigate(['/inventory/stock-taking-approval/view', e.row.data.id]);
  };
}