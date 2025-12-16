import { Component, OnInit } from '@angular/core';
import { DxTreeListModule } from 'devextreme-angular';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccountingService } from '../accounting.service';
import { Account, CreateAccountDto, UpdateAccountDto } from '../models';
import { AddAccountComponent } from '../add-account/add-account.component';

@Component({
  selector: 'app-chart-of-accounts',
  templateUrl: './chart-of-accounts.component.html',
  styleUrls: ['./chart-of-accounts.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxTreeListModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    AddAccountComponent
  ]
})
export class ChartOfAccountsComponent implements OnInit {
  accounts$: Observable<Account[]>;
  accounts: Account[] = [];
  isEditing = false;
  editingAccount: Account | null = null;

  // DevExtreme TreeList columns configuration with translation
  columns = [
    {
      dataField: 'code',
      caption: 'ACCOUNTING.ACCOUNT_CODE',
      width: 120
    },
    {
      dataField: 'name',
      caption: 'ACCOUNTING.ACCOUNT_NAME'
    },
    {
      dataField: 'type',
      caption: 'ACCOUNTING.ACCOUNT_TYPE',
      width: 150,
      lookup: {
        dataSource: [
          { value: 'ASSET', display: 'ACCOUNTING.TYPE_ASSET' },
          { value: 'LIABILITY', display: 'ACCOUNTING.TYPE_LIABILITY' },
          { value: 'EQUITY', display: 'ACCOUNTING.TYPE_EQUITY' },
          { value: 'REVENUE', display: 'ACCOUNTING.TYPE_REVENUE' },
          { value: 'EXPENSE', display: 'ACCOUNTING.TYPE_EXPENSE' }
        ],
        valueExpr: 'value',
        displayExpr: 'display'
      }
    },
    {
      dataField: 'balance',
      caption: 'ACCOUNTING.BALANCE',
      dataType: 'number',
      format: { type: 'currency', currency: 'SAR', precision: 2 },
      width: 120
    },
    {
      caption: 'ACCOUNTING.ACTIONS',
      type: 'buttons',
      width: 120,
      buttons: [
        {
          hint: 'ACCOUNTING.EDIT_ACCOUNT',
          icon: 'edit',
          onClick: (e: any) => this.onEditAccount(e.row.data)
        },
        {
          hint: 'ACCOUNTING.DELETE_ACCOUNT',
          icon: 'trash',
          onClick: (e: any) => this.onDeleteAccount(e.row.data)
        }
      ]
    }
  ];

  constructor(
    private accountingService: AccountingService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.accounts$ = this.accountingService.accounts$;
  }

  ngOnInit() {
    this.loadAccounts();

    // Handle route parameters for editing
    this.route.params.subscribe(params => {
      const accountId = params['id'];
      if (accountId) {
        this.loadAccountForEdit(+accountId);
      }
    });

    // Handle query parameters for adding sub-account
    this.route.queryParams.subscribe(queryParams => {
      const parentId = queryParams['parentId'];
      const mode = queryParams['mode'];

      if (mode === 'add' && parentId) {
        this.prepareAddSubAccount(+parentId);
      } else if (mode === 'edit') {
        // Edit mode is already handled by route params
      } else {
        // Default add mode
        this.onAddAccount();
      }
    });
  }

  loadAccounts() {
    this.accounts$.subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  onAddAccount() {
    this.isEditing = false;
    this.editingAccount = null;
  }

  onEditAccount(account: Account) {
    this.isEditing = true;
    this.editingAccount = account;
  }

  onAccountSaved(account: Account) {
    this.isEditing = false;
    this.editingAccount = null;
  }

  onDeleteAccount(node: any) {
    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE'))) {
      this.accountingService.deleteAccount(node.id).subscribe();
    }
  }

  onCancel() {
    this.isEditing = false;
    this.editingAccount = null;
  }

  private loadAccountForEdit(accountId: number) {
    this.accountingService.getAccountById(accountId).subscribe(account => {
      if (account) {
        this.onEditAccount(account);
      }
    });
  }

  private prepareAddSubAccount(parentId: number) {
    this.isEditing = false;
    this.editingAccount = null;
  }
}