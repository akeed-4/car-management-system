import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DxiColumnModule } from 'devextreme-angular/ui/nested';
import { Router } from '@angular/router';
import { AccountingService } from '../../accounting/accounting.service';
import { OpeningBalanceInventory } from '../../accounting/models';
import { ResponsiveService } from '../../../services/responsive.service';
import { SharedMobileListComponent } from '../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../shared/shared-mobile-list/shared-mobile-list.model';

@Component({
  selector: 'app-opening-balances-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DxiColumnModule,
    SharedMobileListComponent,
  ],
  templateUrl: './opening-balances-inventory-list.component.html',
  styleUrls: ['./opening-balances-inventory-list.component.css']
})
export class OpeningBalancesInventoryListComponent implements OnInit {

  openingBalances = signal<OpeningBalanceInventory[]>([]);

  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  constructor(
    public translate: TranslateService,
    private router: Router,
    private accountingService: AccountingService
  ) {}

  ngOnInit() {
    this.loadOpeningBalances();
  }

  loadOpeningBalances() {
    this.accountingService.getOpeningBalancesInventory().subscribe({
      next: (balances) => {
        this.openingBalances.set(balances);
      },
      error: (error) => {
        console.error('Error loading opening balances:', error);
        this.openingBalances.set([]);
      }
    });
  }

  onNew() {
    this.router.navigate(['/inventory/opening-balances/new']);
  }

  onEditClick = (e: any) => {
    const id = e.row && e.row.data ? e.row.data.id : null;
    if (id) {
      this.router.navigate(['/inventory/opening-balances/edit', id]);
    }
  };

  onDeleteClick = (e: any) => {
    const id = e.row && e.row.data ? e.row.data.id : null;
    if (!id) return;

    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE_OPENING_BALANCE'))) {
      this.accountingService.deleteOpeningBalanceInventory(id).subscribe({
        next: () => {
          this.loadOpeningBalances(); // Reload data
        },
        error: (error) => {
          console.error('Error deleting opening balance:', error);
        }
      });
    }
  };

  // --- Mobile list rendering ---
  mobileTitleOf = (item: OpeningBalanceInventory) => item.itemName;
  mobileTrackBy = (_index: number, item: OpeningBalanceInventory) => item.id ?? item.itemId;

  /** Same field set as the desktop grid's dxi-column definitions. */
  mobileFields: MobileListFieldDto<OpeningBalanceInventory>[] = [
    { label: 'ACCOUNTING.CATEGORY', value: (item) => item.category },
    { label: 'ACCOUNTING.QUANTITY', value: (item) => item.quantity, type: 'number' },
    { label: 'ACCOUNTING.UNIT_COST', value: (item) => item.unitCost, type: 'currency' },
    { label: 'ACCOUNTING.TOTAL_COST', value: (item) => item.totalCost, type: 'currency' },
    { label: 'ACCOUNTING.LOCATION', value: (item) => item.location },
    { label: 'ACCOUNTING.ENTRY_DATE', value: (item) => item.entryDate, type: 'date', format: 'dd/MM/yyyy' },
  ];

  /** Same edit/delete buttons as the desktop grid's dxi-button command column. */
  mobileActions: MobileListActionDto<OpeningBalanceInventory>[] = [
    { id: 'edit', icon: 'edit', labelKey: 'ACCOUNTING.EDIT' },
    { id: 'delete', icon: 'trash', labelKey: 'ACCOUNTING.DELETE' },
  ];

  onMobileAction(e: MobileListActionEvent<OpeningBalanceInventory>): void {
    if (e.actionId === 'edit') this.mobileEdit(e.item);
    else if (e.actionId === 'delete') this.mobileDelete(e.item);
  }

  mobileEdit(item: OpeningBalanceInventory): void {
    this.onEditClick({ row: { data: item } });
  }

  mobileDelete(item: OpeningBalanceInventory): void {
    this.onDeleteClick({ row: { data: item } });
  }
}