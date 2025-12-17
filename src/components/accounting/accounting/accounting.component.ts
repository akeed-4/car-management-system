import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { ChartOfAccountsTreeComponent } from '../chart-of-accounts-tree/chart-of-accounts-tree.component';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
  ],
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.css']
})
export class AccountingComponent {
  selectedTab = 0;

  onTabChange(index: number) {
    this.selectedTab = index;
  }
}