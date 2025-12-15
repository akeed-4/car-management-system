import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// Angular Material Modules
import { MatTreeModule } from '@angular/material/tree';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';

// DevExtreme Modules
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';

// Components
import { AccountingComponent } from './accounting/accounting.component';
import { ChartOfAccountsComponent } from './chart-of-accounts/chart-of-accounts.component';
import { JournalEntriesComponent } from './journal-entries/journal-entries.component';

@NgModule({
  declarations: [
    AccountingComponent,
    ChartOfAccountsComponent,
    JournalEntriesComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatTreeModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatToolbarModule,
    MatTabsModule,
    DxDataGridModule,
    DxButtonModule
  ],
  exports: [
    AccountingComponent,
    ChartOfAccountsComponent,
    JournalEntriesComponent
  ]
})
export class AccountingModule { }