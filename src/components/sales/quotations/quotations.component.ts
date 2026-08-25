import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SalesCycleService } from '../../../services/sales-cycle.service';
import { Quotation } from '../../../models/quotation.model';
import { SharedDataGridComponent } from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto } from '../../../models/grid.model';
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
    SharedDataGridComponent,
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

  /** Config-driven columns -- same fields/formats as before (i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'quotationNumber', dataType: 'string', caption: 'QUOTATIONS.QUOTATION_NUMBER' },
    { dataField: 'quotationDate', dataType: 'date', caption: 'QUOTATIONS.QUOTATION_DATE' },
    { dataField: 'customer.name', dataType: 'string', caption: 'QUOTATIONS.CUSTOMER' },
    { dataField: 'car.description', dataType: 'string', caption: 'QUOTATIONS.CAR' },
    { dataField: 'quotedPrice', dataType: 'number', format: 'currency', caption: 'QUOTATIONS.QUOTED_PRICE' },
    { dataField: 'status', dataType: 'string', caption: 'QUOTATIONS.STATUS' },
  ];

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