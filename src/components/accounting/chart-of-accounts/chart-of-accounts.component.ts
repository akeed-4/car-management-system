import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AccountingService } from '../accounting.service';
import { Account, CreateAccountDto, UpdateAccountDto } from '../models';

interface AccountNode {
  id: number;
  code: string;
  name: string;
  type: string;
  balance: number;
  children?: AccountNode[];
}

interface FlatNode {
  expandable: boolean;
  id: number;
  code: string;
  name: string;
  type: string;
  balance: number;
  level: number;
}

@Component({
  selector: 'app-chart-of-accounts',
  templateUrl: './chart-of-accounts.component.html',
  styleUrls: ['./chart-of-accounts.component.css']
})
export class ChartOfAccountsComponent implements OnInit {
  accounts$: Observable<Account[]>;
  accountForm: FormGroup;
  isEditing = false;
  editingAccountId: number | null = null;

  private transformer = (node: AccountNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      id: node.id,
      code: node.code,
      name: node.name,
      type: node.type,
      balance: node.balance,
      level: level,
    };
  };

  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this.transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(
    private accountingService: AccountingService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {
    this.accounts$ = this.accountingService.accounts$;
    this.accountForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['ASSET', Validators.required],
      parentId: [null]
    });
  }

  ngOnInit() {
    this.accounts$.subscribe(accounts => {
      const treeData = this.buildTree(accounts);
      this.dataSource.data = treeData;
    });
  }

  private buildTree(accounts: Account[]): AccountNode[] {
    const accountMap = new Map<number, AccountNode>();
    const rootNodes: AccountNode[] = [];

    accounts.forEach(account => {
      const node: AccountNode = {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        balance: account.balance,
        children: []
      };
      accountMap.set(account.id, node);

      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  hasChild = (_: number, node: FlatNode) => node.expandable;

  onAddAccount() {
    this.isEditing = false;
    this.editingAccountId = null;
    this.accountForm.reset({ type: 'ASSET' });
  }

  onEditAccount(node: FlatNode) {
    this.isEditing = true;
    this.editingAccountId = node.id;
    this.accountForm.patchValue({
      code: node.code,
      name: node.name,
      type: node.type
    });
  }

  onSaveAccount() {
    if (this.accountForm.valid) {
      const formValue = this.accountForm.value;

      if (this.isEditing && this.editingAccountId) {
        const updateDto: UpdateAccountDto = {
          id: this.editingAccountId,
          ...formValue,
          isActive: true
        };
        this.accountingService.updateAccount(updateDto).subscribe();
      } else {
        const createDto: CreateAccountDto = formValue;
        this.accountingService.createAccount(createDto).subscribe();
      }

      this.accountForm.reset({ type: 'ASSET' });
      this.isEditing = false;
      this.editingAccountId = null;
    }
  }

  onDeleteAccount(node: FlatNode) {
    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE'))) {
      this.accountingService.deleteAccount(node.id).subscribe();
    }
  }

  onCancel() {
    this.accountForm.reset({ type: 'ASSET' });
    this.isEditing = false;
    this.editingAccountId = null;
  }
}