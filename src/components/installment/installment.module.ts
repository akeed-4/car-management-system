import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';

import { InstallmentRoutingModule } from './installment-routing.module';
import { InstallmentDashboardComponent } from './installment-dashboard/installment-dashboard.component';
import { InstallmentSchedulePreviewComponent } from './installment-schedule-preview/installment-schedule-preview.component';
import { InstallmentGridComponent } from './installment-grid/installment-grid.component';
import { InstallmentRescheduleDialogComponent } from './installment-reschedule-dialog/installment-reschedule-dialog.component';

@NgModule({
  declarations: [
    InstallmentDashboardComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InstallmentRoutingModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    TranslateModule,
    DxDataGridModule,
    InstallmentSchedulePreviewComponent,
    InstallmentGridComponent,
    InstallmentRescheduleDialogComponent
  ]
})
export class InstallmentModule { }