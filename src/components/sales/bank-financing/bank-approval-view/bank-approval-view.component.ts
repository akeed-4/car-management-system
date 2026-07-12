import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';
import { AttachmentUploaderComponent } from '../../shared/attachment-uploader/attachment-uploader.component';

@Component({
  selector: 'app-bank-approval-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    TranslateModule,
    AttachmentUploaderComponent
  ],
  templateUrl: './bank-approval-view.component.html',
  styleUrls: ['./bank-approval-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankApprovalViewComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  quotation = signal<BankQuotation | null>(null);
  loading = signal(false);

  statusClass = computed(() => {
    switch (this.quotation()?.status) {
      case 'Locked':
        return 'status-pending';
      case 'Bank_Approved':
      case 'Finalized':
        return 'status-accepted';
      default:
        return 'status-rejected';
    }
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadQuotation(id);
    }
  }

  private loadQuotation(id: number): void {
    this.loading.set(true);
    this.bankFinancingService.getQuotationById(id).subscribe({
      next: quotation => {
        this.quotation.set(quotation);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.APPROVAL_LOAD_FAILED');
      }
    });
  }
}
