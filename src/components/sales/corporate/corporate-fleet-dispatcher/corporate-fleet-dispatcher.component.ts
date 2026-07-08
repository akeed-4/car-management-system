import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { OrderFulfillmentSummaryComponent } from './order-fulfillment-summary/order-fulfillment-summary.component';
import { VinBatchSelectorComponent } from './vin-batch-selector/vin-batch-selector.component';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { ToastService } from '../../../../services/toast.service';
import { OrderFulfillmentProgress, RemainingVinCandidate } from '../../../../models/corporate/corporate-dispatch.model';

@Component({
  selector: 'app-corporate-fleet-dispatcher',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    OrderFulfillmentSummaryComponent,
    VinBatchSelectorComponent
  ],
  templateUrl: './corporate-fleet-dispatcher.component.html',
  styleUrls: ['./corporate-fleet-dispatcher.component.css']
})
export class CorporateFleetDispatcherComponent implements OnInit {
  orderId: number | null = null;
  progress: OrderFulfillmentProgress | null = null;
  remainingVins: RemainingVinCandidate[] = [];
  selectedCarIds: number[] = [];
  loading = false;
  submitting = false;

  constructor(
    private corporateFleetService: CorporateFleetService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.queryParamMap.get('orderId'));
    if (orderId) {
      this.orderId = orderId;
      this.loadData(orderId);
    }
  }

  private loadData(orderId: number): void {
    this.loading = true;
    this.corporateFleetService.getFulfillmentProgress(orderId).subscribe({
      next: progress => {
        this.progress = progress;
      },
      error: () => {
        this.toast.showError('CORPORATE.FULFILLMENT_LOAD_FAILED');
      }
    });

    this.corporateFleetService.getRemainingVinsForOrder(orderId).subscribe({
      next: vins => {
        this.remainingVins = vins;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('CORPORATE.REMAINING_VINS_LOAD_FAILED');
      }
    });
  }

  onSelectionChange(carIds: number[]): void {
    this.selectedCarIds = carIds;
  }

  get isFormValid(): boolean {
    return !!this.orderId && this.selectedCarIds.length > 0;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.orderId) {
      return;
    }

    this.submitting = true;
    this.corporateFleetService
      .processBatch({
        orderId: this.orderId,
        carIds: this.selectedCarIds
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.toast.showSuccess('CORPORATE.BATCH_PROCESSED');
          this.loadData(this.orderId!);
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('CORPORATE.BATCH_PROCESS_FAILED');
        }
      });
  }
}
