import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseReturnFormComponent } from '../../purchase-return-form/purchase-return-form.component';
import { PurchaseReturnType } from '../../../../models/purchase-return-invoice.model';

@Component({
  selector: 'app-credit-purchase-return',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatIconModule,
    PurchaseReturnFormComponent
  ],
  templateUrl: './credit-purchase-return.component.html',
  styleUrl: './credit-purchase-return.component.css'
})
export class CreditPurchaseReturnComponent {
  customTitle: string = 'PURCHASE_RETURN.CREDIT_RETURN_TITLE';
  returnType: PurchaseReturnType = 'CREDIT';
}