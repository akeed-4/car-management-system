import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StockTakeApprovalService } from '../../../services/stock-take-approval.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-stock-taking-approval',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './stock-taking-approval.component.html',
  styleUrl: './stock-taking-approval.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingApprovalComponent {
  private approvalService = inject(StockTakeApprovalService);
  approvals = toSignal(this.approvalService.getApprovals(), { initialValue: [] });
}