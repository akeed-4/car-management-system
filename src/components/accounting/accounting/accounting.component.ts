import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { ChartOfAccountsComponent } from '../chart-of-accounts/chart-of-accounts.component';
import { ChartOfAccountsTreeComponent } from '../chart-of-accounts-tree/chart-of-accounts-tree.component';
import { AccountingModule } from '../accounting.module';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatToolbarModule,
    TranslateModule,
    ChartOfAccountsComponent,
    ChartOfAccountsTreeComponent,
    AccountingModule
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