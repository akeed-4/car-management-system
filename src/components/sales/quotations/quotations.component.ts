import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SalesCycleService } from '../../../services/sales-cycle.service';
import { Quotation } from '../../../models/quotation.model';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.css']
})
export class QuotationsComponent implements OnInit {
  quotations: Quotation[] = [];

  constructor(private salesCycleService: SalesCycleService, private router: Router) { }

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.salesCycleService.getQuotations().subscribe(
      data => this.quotations = data,
      error => console.error('Error loading quotations', error)
    );
  }

  addNewQuotation(): void {
    this.router.navigate(['/sales/quotations/new']);
  }
}