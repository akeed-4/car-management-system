import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { InstallmentService } from '../../../services/installment.service';
import { InstallmentSchedule } from '../../../types/sales-enhancements.model';
import { InstallmentRescheduleDialogComponent } from '../installment-reschedule-dialog/installment-reschedule-dialog.component';

@Component({
  selector: 'app-installment-dashboard',
  templateUrl: './installment-dashboard.component.html',
  styleUrls: ['./installment-dashboard.component.css']
})
export class InstallmentDashboardComponent implements OnInit {
  scheduleForm: FormGroup;
  previewSchedule: InstallmentSchedule | null = null;
  schedules: InstallmentSchedule[] = [];

  constructor(
    private fb: FormBuilder,
    private installmentService: InstallmentService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.scheduleForm = this.fb.group({
      totalAmount: [0, [Validators.required, Validators.min(1)]],
      downPayment: [0, [Validators.required, Validators.min(0)]],
      interestRate: [0, [Validators.required, Validators.min(0)]],
      termMonths: [12, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadSchedules();
  }

  generatePreview(): void {
    if (this.scheduleForm.valid) {
      const { totalAmount, downPayment, interestRate, termMonths } = this.scheduleForm.value;
      this.installmentService.generateSchedulePreview(totalAmount, downPayment, interestRate, termMonths)
        .subscribe(schedule => {
          this.previewSchedule = schedule;
        });
    }
  }

  loadSchedules(): void {
    this.installmentService.getInstallmentSchedules().subscribe(schedules => {
      this.schedules = schedules;
    });
  }

  openRescheduleDialog(schedule: InstallmentSchedule): void {
    const dialogRef = this.dialog.open(InstallmentRescheduleDialogComponent, {
      width: '600px',
      data: { schedule }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSchedules();
      }
    });
  }
}