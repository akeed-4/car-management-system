import { Component, OnInit, computed, signal } from '@angular/core';
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
  ],
  templateUrl: './opening-balances-inventory-list.component.html',
  styleUrls: ['./opening-balances-inventory-list.component.css']
})
export class OpeningBalancesInventoryListComponent implements OnInit {

  openingBalances = signal<OpeningBalanceInventory[]>([]);

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
}