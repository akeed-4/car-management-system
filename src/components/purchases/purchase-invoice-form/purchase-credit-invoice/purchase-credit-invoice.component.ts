import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseInvoiceComponent } from '../../purchase-invoice/purchase-invoice.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-purchase-credit-invoice',
  standalone: true,
  imports: [
    CommonModule, 
    PurchaseInvoiceComponent,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule
  ],
  templateUrl: './purchase-credit-invoice.component.html',
  styleUrls: ['./purchase-credit-invoice.component.css']
})
export class PurchaseCreditInvoiceComponent implements OnInit {
  @ViewChild(PurchaseInvoiceComponent) purchaseInvoice!: PurchaseInvoiceComponent;
  
  ngOnInit(): void {
    // The payment method locking is now handled by the @Input() properties
    // passed to the <app-purchase-invoice> component in the template
  }
}
