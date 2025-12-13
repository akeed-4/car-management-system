import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InstallmentDashboardComponent } from './installment-dashboard/installment-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: InstallmentDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InstallmentRoutingModule { }