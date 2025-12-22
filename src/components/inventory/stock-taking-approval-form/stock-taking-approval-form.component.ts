import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StockTakeService } from '../../../services/stock-take.service';
import { StockTakeApprovalService } from '../../../services/stock-take-approval.service';
import { InventoryService } from '../../../services/inventory.service';
import { StockTake } from '../../../types/stock-take.model';
import { StockTakeApproval } from '../../../types/stock-take-approval.model';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-stock-taking-approval-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DxDataGridModule
  ],
  templateUrl: './stock-taking-approval-form.component.html',
  styleUrl: './stock-taking-approval-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingApprovalFormComponent implements OnInit {
  private router = inject(Router);
  private stockTakeService = inject(StockTakeService);
  private approvalService = inject(StockTakeApprovalService);
  private inventoryService = inject(InventoryService);

  approvalForm!: FormGroup;

  // Data Sources
  private allStockTakes = toSignal(this.stockTakeService.getStockTakes(), { initialValue: [] });
  pendingStockTakes = computed(() => this.allStockTakes().filter(st => st.status === 'Submitted'));

  selectedStockTake = signal<StockTake | null>(null);

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.approvalForm = new FormGroup({
      stockTake: new FormControl(null, Validators.required),
      approvalDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      approverName: new FormControl('', Validators.required),
      approvalStatus: new FormControl('Approved', Validators.required),
      notes: new FormControl('')
    });
  }

  onStockTakeSelect(id: number | null): void {
    this.approvalForm.patchValue({ stockTake: id });
    if (id) {
      this.stockTakeService.getStockTakeById(id).subscribe(stockTake => {
        this.selectedStockTake.set(stockTake ?? null);
      });
    } else {
      this.selectedStockTake.set(null);
    }
  }

  approveStockTake(): void {
    if (this.approvalForm.invalid) {
      return;
    }

    const formValue = this.approvalForm.value;
    const stockTake = this.selectedStockTake();
    if (!stockTake) {
      alert('الرجاء اختيار مستند جرد.');
      return;
    }

    // 1. Update inventory quantities if approved
    if (formValue.approvalStatus === 'Approved') {
      stockTake.items.forEach(item => {
        // Assuming we need to update inventory based on itemId
        // this.inventoryService.setItemQuantity(item.itemId, item.quantityCounted);
      });
    }

    // 2. Update stock take status
    const newStatus = formValue.approvalStatus === 'Approved' ? 'Approved' : 
                     formValue.approvalStatus === 'Rejected' ? 'Rejected' : 'Submitted';
    this.stockTakeService.updateStockTakeStatus(stockTake.id, newStatus);

    // 3. Create and save the approval document
    const newApproval: Omit<StockTakeApproval, 'id'> = {
      date: formValue.approvalDate,
      approverName: formValue.approverName,
      stockTakeId: stockTake.id,
      stockTakeName: stockTake.documentCode,
      status: formValue.approvalStatus,
      notes: formValue.notes
    };
    this.approvalService.addApproval(newApproval);

    alert(`تم ${formValue.approvalStatus === 'Approved' ? 'اعتماد' : formValue.approvalStatus === 'Rejected' ? 'رفض' : 'تقديم'} الجرد "${stockTake.documentCode}" بنجاح.`);
    this.router.navigate(['/inventory/stock-taking-approval']);
  }

  getDifference(countedQuantity: number, systemQuantity: number): number {
    return countedQuantity - systemQuantity;
  }

  getDifferenceDisplayValue = (rowData: any) => {
    const diff = this.getDifference(rowData.countedQuantity, rowData.systemQuantity);
    return diff > 0 ? '+' + diff : diff.toString();
  };
}