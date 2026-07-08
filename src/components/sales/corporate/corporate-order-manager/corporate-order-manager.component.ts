import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { CreditUtilizationWidgetComponent } from './credit-utilization-widget/credit-utilization-widget.component';
import { PoReferenceFormComponent } from './po-reference-form/po-reference-form.component';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { ToastService } from '../../../../services/toast.service';
import { CorporateClient, CorporateQuotation } from '../../../../models/corporate/corporate-quotation.model';
import { POReferenceData } from '../../../../models/corporate/corporate-order.model';

@Component({
  selector: 'app-corporate-order-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    CreditUtilizationWidgetComponent,
    PoReferenceFormComponent
  ],
  templateUrl: './corporate-order-manager.component.html',
  styleUrls: ['./corporate-order-manager.component.css']
})
export class CorporateOrderManagerComponent implements OnInit {
  quotation: CorporateQuotation | null = null;
  client: CorporateClient | null = null;
  loading = false;
  poData: POReferenceData | null = null;
  submitting = false;

  constructor(
    private corporateFleetService: CorporateFleetService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const quotationId = Number(this.route.snapshot.queryParamMap.get('quotationId'));
    if (quotationId) {
      this.loadQuotation(quotationId);
    }
  }

  private loadQuotation(quotationId: number): void {
    this.loading = true;
    this.corporateFleetService.getQuotationById(quotationId).subscribe({
      next: quotation => {
        this.quotation = quotation;
        this.loadClient(quotation.clientId);
      },
      error: () => {
        this.loading = false;
        this.toast.showError('CORPORATE.QUOTATION_LOAD_FAILED');
      }
    });
  }

  private loadClient(clientId: number): void {
    this.corporateFleetService.getCorporateClientById(clientId).subscribe({
      next: client => {
        this.client = client;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('CORPORATE.CLIENT_LOAD_FAILED');
      }
    });
  }

  onPoDataChange(poData: POReferenceData | null): void {
    this.poData = poData;
  }

  get exceedsCreditLimit(): boolean {
    if (!this.quotation || !this.client) {
      return false;
    }
    return this.client.currentOutstandingBalance + this.quotation.totalAmount > this.client.creditLimit;
  }

  get isFormValid(): boolean {
    return !!this.quotation && !!this.poData && !this.exceedsCreditLimit;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.quotation?.id || !this.poData) {
      return;
    }

    this.submitting = true;
    this.corporateFleetService
      .createOrder({
        quotationId: this.quotation.id,
        purchaseOrderReference: this.poData.purchaseOrderReference,
        contractTerm: this.poData.contractTerm
      })
      .subscribe({
        next: order => {
          this.submitting = false;
          this.toast.showSuccess('CORPORATE.ORDER_CREATED');
          this.router.navigate(['/sales/corporate/dispatch'], {
            queryParams: { orderId: order.id }
          });
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('CORPORATE.ORDER_CREATE_FAILED');
        }
      });
  }
}
