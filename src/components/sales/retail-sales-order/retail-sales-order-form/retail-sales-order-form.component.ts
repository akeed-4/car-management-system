import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RetailSalesOrderService } from '../../../../services/retail-sales-order.service';
import { NotificationService } from '../../../../services/notification.service';
import { PendingRetailQuotationLookupDto, RetailSalesOrderLineDto } from '../../../../models/retail-sales-order.model';

@Component({
  selector: 'app-retail-sales-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './retail-sales-order-form.component.html',
  styleUrls: ['./retail-sales-order-form.component.css']
})
export class RetailSalesOrderFormComponent implements OnInit {
  orderForm!: FormGroup;
  isEditMode = false;
  orderId: number | null = null;
  currentStatus: string | null = null;

  pendingQuotations: PendingRetailQuotationLookupDto[] = [];
  selectedQuotation: PendingRetailQuotationLookupDto | null = null;
  lines: RetailSalesOrderLineDto[] = [];
  orderNumber = '';

  constructor(
    private fb: FormBuilder,
    private retailSalesOrderService: RetailSalesOrderService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.orderId = +params['id'];
        this.loadOrder(this.orderId);
      } else {
        this.loadPendingQuotations();
        this.route.queryParams.subscribe(q => {
          if (q['quotationId']) {
            this.orderForm.patchValue({ retailQuotationId: +q['quotationId'] });
          }
        });
      }
    });
  }

  initForm(): void {
    this.orderForm = this.fb.group({
      retailQuotationId: [null, Validators.required],
      notes: ['']
    });
  }

  loadPendingQuotations(): void {
    this.retailSalesOrderService.getPendingQuotations().subscribe({
      next: (quotations: any) => {
        this.pendingQuotations = Array.isArray(quotations) ? quotations : (quotations?.data ?? []);
      },
      error: (err) => {
        console.error('Error loading pending quotations', err);
      }
    });
  }

  onQuotationChange(quotationId: number): void {
    this.selectedQuotation = this.pendingQuotations.find(q => q.id === quotationId) ?? null;
  }

  loadOrder(id: number): void {
    this.retailSalesOrderService.getById(id).subscribe({
      next: (order) => {
        this.currentStatus = order.status;
        this.orderNumber = order.orderNumber;
        this.orderForm.patchValue({
          retailQuotationId: order.retailQuotationId,
          notes: order.notes
        });
        this.selectedQuotation = {
          id: order.retailQuotationId,
          quotationNumber: '',
          customerName: order.customerName,
          quotationDate: order.orderDate,
          totalAmount: order.totalAmount
        };
        this.lines = order.lines || [];

        if (order.status !== 'Draft') {
          this.orderForm.disable();
        }
      },
      error: (err) => {
        console.error('Error loading sales order', err);
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.LOAD_ERROR'));
      }
    });
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      if (!this.orderForm.value.retailQuotationId) {
        this.notificationService.showWarning(this.translateService.instant('RETAIL_SALES_ORDER.NO_QUOTATION_WARNING'));
      }
      return;
    }

    const raw = this.orderForm.getRawValue();

    const onSuccess = () => {
      this.notificationService.showSuccess(this.translateService.instant('RETAIL_SALES_ORDER.SAVE_SUCCESS'));
      this.router.navigate(['/sales/direct/orders']);
    };
    const onError = (err: any) => {
      console.error('Error saving sales order', err);
      this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.SAVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
    };

    if (this.isEditMode && this.orderId) {
      this.retailSalesOrderService.update(this.orderId, { notes: raw.notes }).subscribe({ next: onSuccess, error: onError });
    } else {
      this.retailSalesOrderService.create({
        retailQuotationId: raw.retailQuotationId,
        notes: raw.notes,
        userId: 1
      }).subscribe({ next: onSuccess, error: onError });
    }
  }

  onCancel(): void {
    this.router.navigate(['/sales/direct/orders']);
  }
}
