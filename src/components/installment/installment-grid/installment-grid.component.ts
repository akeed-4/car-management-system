import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { InstallmentService } from '../../../services/installment.service';
import { InstallmentSchedule, Installment } from '../../../types/sales-enhancements.model';

@Component({
  selector: 'app-installment-grid',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslateModule, DxDataGridModule],
  templateUrl: './installment-grid.component.html',
  styleUrls: ['./installment-grid.component.css']
})
export class InstallmentGridComponent {
  @Input() schedules: InstallmentSchedule[] = [];
  @Input() readOnly: boolean = false;
  @Output() reschedule = new EventEmitter<InstallmentSchedule>();

  gridDataSource: any;

  constructor(private installmentService: InstallmentService) {}

  ngOnInit(): void {
    this.gridDataSource = this.schedules;
  }

  onRowPrepared(e: any): void {
    if (e.rowType === 'data') {
      const installment = e.data as Installment;
      if (installment.overdue) {
        e.rowElement.style.backgroundColor = '#ffebee';
      }
    }
  }

  onRegisterPayment(e: any): void {
    const installment = e.row.data as Installment;
    // Implement payment registration logic
    this.installmentService.registerPayment({
      installmentId: installment.id,
      paymentAmount: installment.amount,
      paymentDate: new Date()
    }).subscribe(() => {
      // Refresh grid
      this.loadData();
    });
  }

  onReschedule(e: any): void {
    const schedule = e.row.data as InstallmentSchedule;
    this.reschedule.emit(schedule);
  }

  private loadData(): void {
    this.installmentService.getInstallmentSchedules().subscribe(schedules => {
      this.gridDataSource = schedules;
    });
  }
}