import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { CorporateClientSelectorComponent } from './corporate-client-selector/corporate-client-selector.component';
import { FleetItemTableComponent } from './fleet-item-table/fleet-item-table.component';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { ToastService } from '../../../../services/toast.service';
import { CorporateClient, FleetItem } from '../../../../models/corporate/corporate-quotation.model';

@Component({
  selector: 'app-corporate-quotation-container',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    CorporateClientSelectorComponent,
    FleetItemTableComponent
  ],
  templateUrl: './corporate-quotation-container.component.html',
  styleUrls: ['./corporate-quotation-container.component.css']
})
export class CorporateQuotationContainerComponent {
  selectedClient: CorporateClient | null = null;
  items: FleetItem[] = [];
  submitting = false;

  constructor(
    private corporateFleetService: CorporateFleetService,
    private toast: ToastService,
    private router: Router
  ) {}

  onClientSelected(client: CorporateClient | null): void {
    this.selectedClient = client;
  }

  onItemsChange(items: FleetItem[]): void {
    this.items = items;
  }

  get subTotal(): number {
    return this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  get totalDiscount(): number {
    return this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discountRate) / 100, 0);
  }

  get totalAmount(): number {
    return this.subTotal - this.totalDiscount;
  }

  get isFormValid(): boolean {
    return !!this.selectedClient && this.items.length > 0 && this.items.every(i => i.quantity > 0 && i.unitPrice > 0);
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.selectedClient) {
      return;
    }

    this.submitting = true;
    this.corporateFleetService
      .createQuotation({
        quotationDate: new Date().toISOString().split('T')[0],
        clientId: this.selectedClient.id,
        items: this.items,
        subTotal: this.subTotal,
        totalDiscount: this.totalDiscount,
        totalAmount: this.totalAmount
      })
      .subscribe({
        next: quotation => {
          this.submitting = false;
          this.toast.showSuccess('CORPORATE.QUOTATION_CREATED');
          this.router.navigate(['/sales/corporate/orders/new'], {
            queryParams: { quotationId: quotation.id }
          });
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('CORPORATE.QUOTATION_CREATE_FAILED');
        }
      });
  }
}
