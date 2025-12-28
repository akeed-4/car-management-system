import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
    CommonModule,
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
  private route = inject(ActivatedRoute);
  private stockTakeService = inject(StockTakeService);
  private approvalService = inject(StockTakeApprovalService);
  private inventoryService = inject(InventoryService);
  private stockTakeApprovalService = inject(StockTakeApprovalService);

  approvalForm!: FormGroup;

  // Data Sources
  allStockTakes = toSignal(this.stockTakeService.getStockTakes(), { initialValue: [] });
  pendingStockTakes = signal<StockTake[]>([]);
  isEditMode = signal(false);
constructor() {
  this.onStockTakeSelect=(this.onStockTakeSelect.bind(this));
  this.saveApproval=(this.saveApproval.bind(this));
  this.getDifferenceDisplayValue=(this.getDifferenceDisplayValue.bind(this));
}
  selectedStockTake = signal<StockTake | null>(null);
 selectedStockTakeApproval = signal<StockTakeApproval | null>(null);
  ngOnInit() {
    this.initForm();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.stockTakeApprovalService.getApprovalById(id).subscribe(approval => {
        this.selectedStockTakeApproval.set(approval);
        console.log('Loaded approval for editing:', approval);
        this.stockTakeService.getStockTakeById(approval.id).subscribe(stockTake => {
          this.selectedStockTake.set(stockTake);
          this.approvalForm.patchValue({
            stockTake: stockTake.id,
            approvalDate: approval.date,
            Name: approval.Name,
            approvalStatus: approval.status,
            notes: approval.notes
          });
        });
      });
    } else {
      this.loadstockTake(1);
    }
  }
  loadstockTake(arg0: number) {
    this.stockTakeService.getStockTakesByStore(1).subscribe(result => {
      // Filter for pending/submitted stock takes
      const filtered = result;
      this.pendingStockTakes.set(filtered);
    });
  }

  private initForm() {
    this.approvalForm = new FormGroup({
      stockTake: new FormControl(null, Validators.required),
      approvalDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      Name: new FormControl('', Validators.required),
      approvalStatus: new FormControl('Approved', Validators.required),
      notes: new FormControl('')
    });
  }

  onStockTakeSelect(id: number | null): void {
    this.approvalForm.patchValue({ stockTake: id });
    if (id) {
      this.stockTakeService.getStockTakeById(id).subscribe(stockTake => {
        if (stockTake) {
          // Fetch system quantities for each item
            this.selectedStockTake.set(stockTake);
        } else {
          this.selectedStockTake.set(null);
        }
      });
    } 
  }

  saveApproval(): void {
    if (this.approvalForm.invalid) {
      return;
    }

    const formValue = this.approvalForm.value;
    const stockTake = this.selectedStockTake();
    if (!stockTake) {
      alert('الرجاء اختيار مستند جرد.');
      return;
    }

    const approvalData: Omit<StockTakeApproval, 'id'> = {
      date: formValue.approvalDate,
      Name: formValue.Name,
      stockTakeId: stockTake.id,
      stockTakeName: stockTake.documentName,
      status: formValue.approvalStatus,
      storeId: stockTake.storeId,
      notes: formValue.notes,
      items: this.selectedStockTakeApproval()?.items || stockTake.items
    };

    if (this.isEditMode()) {
      const approvalId = this.selectedStockTakeApproval()?.id;
      if (approvalId) {
        const approval: StockTakeApproval = {
          id: approvalId,
          ...approvalData
        };
        this.approvalService.updateApproval(approval).subscribe(() => {
          // Update stock take status
          const newStatus = formValue.approvalStatus === 'Approved' ? 'Approved' : 
                           formValue.approvalStatus === 'Rejected' ? 'Rejected' : 'Submitted';
          this.stockTakeService.updateStockTakeStatus(stockTake.id, newStatus).subscribe(() => {
            alert(`تم تحديث ${formValue.approvalStatus === 'Approved' ? 'الاعتماد' : formValue.approvalStatus === 'Rejected' ? 'الرفض' : 'التقديم'} للجرد "${stockTake.documentName}" بنجاح.`);
            this.router.navigate(['/inventory/stock-taking-approval']);
          });
        });
      }
    } else {
      this.approvalService.addApproval(approvalData).subscribe(() => {
        // Update stock take status
        const newStatus = formValue.approvalStatus === 'Approved' ? 'Approved' : 
                         formValue.approvalStatus === 'Rejected' ? 'Rejected' : 'Submitted';
        this.stockTakeService.updateStockTakeStatus(stockTake.id, newStatus).subscribe(() => {
          alert(`تم ${formValue.approvalStatus === 'Approved' ? 'اعتماد' : formValue.approvalStatus === 'Rejected' ? 'رفض' : 'تقديم'} الجرد "${stockTake.documentName}" بنجاح.`);
          this.router.navigate(['/inventory/stock-taking-approval']);
        });
      });
    }
  }

  getDifference(countedQuantity: number, systemQuantity: number): number {
    return countedQuantity - systemQuantity;
  }

  getDifferenceDisplayValue = (rowData: any) => {
    const counted = Number(rowData.quantityCounted);
    const system = Number(rowData.systemQuantity);
    if (isNaN(counted) || isNaN(system)) {
      return 'N/A';
    }
    const diff = this.getDifference(counted, system);
    return diff > 0 ? '+' + diff : diff.toString();
  };
}