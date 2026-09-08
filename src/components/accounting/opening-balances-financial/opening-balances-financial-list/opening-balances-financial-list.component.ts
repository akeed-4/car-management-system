import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OpeningBalanceFinancial } from '../../models';
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';

@Component({
  selector: 'app-opening-balances-financial-list',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    SharedMobileListComponent
  ],
  templateUrl: './opening-balances-financial-list.component.html',
  styleUrls: ['./opening-balances-financial-list.component.css']
})
export class OpeningBalancesFinancialListComponent {
  @Input() openingBalances: OpeningBalanceFinancial[] = [];
  @Output() edit = new EventEmitter<OpeningBalanceFinancial>();
  @Output() delete = new EventEmitter<OpeningBalanceFinancial>();

  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  constructor(
    public translate: TranslateService,
    private router: Router
  ) {}

  /** Same field set as the desktop grid's dxi-column definitions. */
  mobileFields: MobileListFieldDto<OpeningBalanceFinancial>[] = [
    { label: 'ACCOUNTING.ACCOUNT_TYPE', value: (b) => b.accountType },
    { label: 'ACCOUNTING.OPENING_BALANCE', value: (b) => b.openingBalance, type: 'currency' },
    { label: 'ACCOUNTING.CURRENCY', value: (b) => b.currency },
    { label: 'ACCOUNTING.NOTES_EN', value: (b) => b.notes },
    { label: 'ACCOUNTING.ENTRY_DATE', value: (b) => b.entryDate, type: 'date', format: 'dd/MM/yyyy' },
  ];

  /** Same edit/delete buttons as the desktop grid's dxi-button command column. */
  mobileActions: MobileListActionDto<OpeningBalanceFinancial>[] = [
    { id: 'edit', icon: 'edit', labelKey: 'ACCOUNTING.EDIT' },
    { id: 'delete', icon: 'trash', labelKey: 'ACCOUNTING.DELETE' },
  ];

  mobileTitleOf = (b: OpeningBalanceFinancial) => b.accountName;
  mobileTrackBy = (index: number, b: OpeningBalanceFinancial) => b.id ?? index;

  onMobileAction(e: MobileListActionEvent<OpeningBalanceFinancial>): void {
    if (e.actionId === 'edit') this.onEdit(e.item);
    else if (e.actionId === 'delete') this.onDelete(e.item);
  }

  onEdit(balance: OpeningBalanceFinancial) {
    this.edit.emit(balance);
  }

  onDelete(balance: OpeningBalanceFinancial) {
    this.delete.emit(balance);
  }

  navigateToNewForm() {
    this.router.navigate(['/accounts/opening-balances-financial/new']);
  }
}