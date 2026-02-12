import { Component, OnInit } from '@angular/core';
import { SalesCycleService } from '../../../services/sales-cycle.service';
import { Quotation } from '../../../models/quotation.model';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.css']
})
export class QuotationsComponent implements OnInit {
  quotations: Quotation[] = [];

  constructor(private salesCycleService: SalesCycleService) { }

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.salesCycleService.getQuotations().subscribe(
      data => this.quotations = data,
      error => console.error('Error loading quotations', error)
    );
  }
}