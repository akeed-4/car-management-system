import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleSpecsDisplayComponent } from './vehicle-specs-display/vehicle-specs-display.component';
import { GatePassChecklistComponent } from './gate-pass-checklist/gate-pass-checklist.component';
import { RetailService } from '../../../../services/retail.service';
import { ToastService } from '../../../../services/toast.service';
import { VehicleSpecs, GatePassChecklistData } from '../../../../models/retail/retail-delivery.model';

@Component({
  selector: 'app-retail-delivery-container',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    VehicleSpecsDisplayComponent,
    GatePassChecklistComponent
  ],
  templateUrl: './retail-delivery-container.component.html',
  styleUrls: ['./retail-delivery-container.component.css']
})
export class RetailDeliveryContainerComponent implements OnInit {
  invoiceId: number | null = null;
  vehicleSpecs: VehicleSpecs | null = null;
  checklist: GatePassChecklistData | null = null;
  loading = false;
  submitting = false;

  constructor(
    private retailService: RetailService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const invoiceId = Number(this.route.snapshot.queryParamMap.get('invoiceId'));
    if (invoiceId) {
      this.invoiceId = invoiceId;
    }
  }

  onChecklistChange(checklist: GatePassChecklistData | null): void {
    this.checklist = checklist;
  }

  get isFormValid(): boolean {
    return !!this.invoiceId && !!this.checklist;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.invoiceId || !this.checklist) {
      return;
    }

    this.submitting = true;
    this.retailService
      .createDelivery({
        salesInvoiceId: this.invoiceId,
        gatePassSerial: this.checklist.gatePassSerial,
        notes: this.checklist.notes,
        userId: 1
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.toast.showSuccess('RETAIL.DELIVERY_COMPLETED');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('RETAIL.DELIVERY_CREATE_FAILED');
        }
      });
  }
}
