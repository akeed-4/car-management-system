import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { PaymentService } from '../../../services/payment.service';
import { Payment } from '../../../models/payment.model';
import { AccountingService } from '../../accounting/accounting.service';
import { Account } from '../../accounting/models';
import CustomStore from 'devextreme/data/custom_store';
import { map } from 'rxjs';
import { ToastService } from '@/src/services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent implements OnDestroy, AfterViewInit {
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private accountingService = inject(AccountingService);
  private toastService = inject(NotificationService);

  @ViewChild('toastContainer') toastContainer!: ElementRef;
  
  editPayment = (e: any) => {
    const paymentId = e.row.data.id;
    if (paymentId) {
      this.router.navigate(['/accounts/payments/edit', paymentId]);
    } else {
      console.error('Payment ID not found:', e.row.data);
    }
  }


  deletePayment = (e: any) => {
        const paymentId = e.row.data.id;
    if (confirm(this.translate.instant('ACCOUNTS.PAYMENTS.CONFIRM_DELETE') || 'Are you sure you want to delete this payment?')) {
      this.paymentService.deletePayment(paymentId).subscribe({
        next: () => {
          // Refresh the grid data
          this.dataSource.load();
          this.toastService.showSuccess(this.translate.instant('ACCOUNTS.PAYMENTS.DELETED') || 'Payment deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting payment:', error);
          alert(this.translate.instant('ACCOUNTS.PAYMENTS.ERROR_DELETING') || 'Error deleting payment');
        }
      });
    }
  }

  trackByPaymentId(index: number, payment: Payment): number {
    return payment.id!;
  }

  payments = toSignal(this.paymentService.payments$, {initialValue: []});
  accounts = signal<Account[]>([]);

  dataSource = new CustomStore({
    key: 'id',
    load: (loadOptions) => {
      return this.paymentService.getPayments().toPromise();
    }
  });

  ngAfterViewInit(): void {
    // Set the toast container for this component
    if (this.toastContainer) {
      // this.toastService.setContainer('toast-payments-container');
    }
  }

  ngOnDestroy(): void {
    // Clear the container when component is destroyed
    // this.toastService.clearContainer();
  }
}