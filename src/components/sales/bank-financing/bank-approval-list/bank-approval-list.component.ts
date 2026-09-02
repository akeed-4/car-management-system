import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../../services/permission.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-bank-approval-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedDataGridComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './bank-approval-list.component.html',
  styleUrls: ['./bank-approval-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankApprovalListComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  permissionService = inject(PermissionService);

  quotations = signal<BankQuotation[]>([]);
  loading = signal(false);

  /** Same badge classes/labels as before -- status is not a plain boolean, so
   *  it's ported via a projected cell template rather than the generic
   *  built-in type:'status' template. */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');
  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/captions as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'quotationNumber', dataType: 'string', caption: 'CORPORATE.QUOTATION_NUMBER' },
    { dataField: 'endUserName', dataType: 'string', caption: 'BANK_FINANCING.END_USER_NAME' },
    { dataField: 'bankName', dataType: 'string', caption: 'BANK_FINANCING.BANK' },
    { dataField: 'vin', dataType: 'string', caption: 'VIN' },
    { dataField: 'bankLpoReference', dataType: 'string', caption: 'BANK_FINANCING.LPO_REFERENCE' },
    { dataField: 'status', dataType: 'string', caption: 'CORPORATE.ORDER_STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 80, allowSorting: false, allowFiltering: false },
  ];

  /** Same single view button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'find', labelKey: 'COMMON.VIEW', visible: () => this.permissionService.hasPermission('sales.bank.approvals.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'view') this.onView({ row: { data: e.row } });
  }

  /** Row double-click opens the record -- same behavior, adapted to the shared output. */
  onGridRowDblClick(row: any): void {
    this.onView({ row: { data: row } });
  }

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.loading.set(true);
    this.bankFinancingService.getAllBankQuotations().subscribe({
      next: quotations => {
        this.quotations.set(quotations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.APPROVALS_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/bank/approvals/new']);
  }

  onView = (e: any): void => {
    const id = e.row.data.id;
    this.router.navigate(['/sales/bank/approvals/view', id]);
  };
}
