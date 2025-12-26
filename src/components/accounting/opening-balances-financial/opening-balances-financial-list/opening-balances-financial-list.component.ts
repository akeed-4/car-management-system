import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OpeningBalanceFinancial } from '../../models';

@Component({
  selector: 'app-opening-balances-financial-list',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './opening-balances-financial-list.component.html',
  styleUrls: ['./opening-balances-financial-list.component.css']
})
export class OpeningBalancesFinancialListComponent {
  @Input() openingBalances: OpeningBalanceFinancial[] = [];
  @Output() edit = new EventEmitter<OpeningBalanceFinancial>();
  @Output() delete = new EventEmitter<OpeningBalanceFinancial>();

  constructor(
    public translate: TranslateService,
    private router: Router
  ) {}

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