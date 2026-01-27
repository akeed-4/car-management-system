import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { InfoBankService } from '../../../services/info-bank.service';
import { InfoBank } from '../../../models/info-bank.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-bank-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    TranslateModule
  ],
  templateUrl: './bank-list.component.html',
  styleUrls: ['./bank-list.component.css']
})
export class BankListComponent implements OnInit {
  private router = inject(Router);
  private infoBankService = inject(InfoBankService);

  displayedColumns: string[] = ['name', 'accountNumber', 'branch', 'currency', 'isActive', 'actions'];
  infoBanks = this.infoBankService.infoBanks;

  ngOnInit() {
    this.infoBankService.loadInfoBanks();
  }

  addNew() {
    this.router.navigate(['/bank/form']);
  }

  edit(infoBank: InfoBank) {
    this.router.navigate(['/bank/form', infoBank.id]);
  }

  delete(infoBank: InfoBank) {
    if (confirm('Are you sure you want to delete this info bank?')) {
      this.infoBankService.deleteInfoBank(infoBank.id!).subscribe(() => {
        this.infoBankService.loadInfoBanks();
      });
    }
  }
}