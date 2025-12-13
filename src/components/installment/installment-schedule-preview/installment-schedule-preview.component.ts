import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { InstallmentSchedule } from '../../../types/sales-enhancements.model';

@Component({
  selector: 'app-installment-schedule-preview',
  standalone: true,
  imports: [CommonModule, MatTableModule, TranslateModule],
  templateUrl: './installment-schedule-preview.component.html',
  styleUrls: ['./installment-schedule-preview.component.css']
})
export class InstallmentSchedulePreviewComponent {
  @Input() schedule!: InstallmentSchedule;

  displayedColumns: string[] = ['dueDate', 'amount', 'paid', 'overdue'];

  getTotalAmount(): number {
    return this.schedule.installments.reduce((sum, inst) => sum + inst.amount, 0);
  }
}