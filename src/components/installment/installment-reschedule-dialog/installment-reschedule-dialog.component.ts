import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { InstallmentService } from '../../../services/installment.service';
import { InstallmentSchedule, InstallmentReschedule } from '../../../types/sales-enhancements.model';

@Component({
  selector: 'app-installment-reschedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './installment-reschedule-dialog.component.html',
  styleUrls: ['./installment-reschedule-dialog.component.css']
})
export class InstallmentRescheduleDialogComponent {
  rescheduleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private installmentService: InstallmentService,
    private dialogRef: MatDialogRef<InstallmentRescheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { schedule: InstallmentSchedule }
  ) {
    this.rescheduleForm = this.fb.group({
      reason: ['', Validators.required],
      newTermMonths: [data.schedule.termMonths, [Validators.required, Validators.min(1)]],
      newInterestRate: [data.schedule.interestRate, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.rescheduleForm.valid) {
      const { reason, newTermMonths, newInterestRate } = this.rescheduleForm.value;
      const rescheduleData: InstallmentReschedule = {
        id: 0,
        originalScheduleId: this.data.schedule.id,
        newSchedule: {
          ...this.data.schedule,
          termMonths: newTermMonths,
          interestRate: newInterestRate,
          updatedAt: new Date()
        },
        reason,
        rescheduledAt: new Date(),
        history: []
      };

      this.installmentService.rescheduleInstallment(this.data.schedule.id, rescheduleData).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}