import { Injectable, signal } from '@angular/core';
import { StockTakeApproval } from '../types/stock-take-approval.model';

@Injectable({
  providedIn: 'root',
})
export class StockTakeApprovalService {
  private nextId = signal(1);
  private approvals = signal<StockTakeApproval[]>([]);

  public approvals$ = this.approvals.asReadonly();

  addApproval(approval: Omit<StockTakeApproval, 'id'>) {
    const newApproval: StockTakeApproval = {
      ...approval,
      id: this.nextId(),
    };
    this.approvals.update(approvals => [...approvals, newApproval]);
    this.nextId.update(id => id + 1);
  }
}