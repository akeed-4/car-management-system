import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseReturnFormComponent } from '../../purchase-return-form/purchase-return-form.component';
import { PurchaseReturnType } from '../../../../types/purchase-return-invoice.model';

@Component({
  selector: 'app-cash-purchase-return',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatIconModule,
    PurchaseReturnFormComponent
  ],
  templateUrl: './cash-purchase-return.component.html',
  styleUrl: './cash-purchase-return.component.css'
})
export class CashPurchaseReturnComponent {
  returnType: PurchaseReturnType = 'CASH';
}