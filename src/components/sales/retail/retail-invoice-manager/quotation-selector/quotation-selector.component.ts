import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { RetailService } from '../../../../../services/retail.service';
import { RetailQuotation } from '../../../../../models/retail/retail-quotation.model';

@Component({
  selector: 'app-quotation-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './quotation-selector.component.html',
  styleUrls: ['./quotation-selector.component.css']
})
export class QuotationSelectorComponent implements OnInit {
  @Output() quotationIdSelected = new EventEmitter<number>();

  quotations: RetailQuotation[] = [];
  loading = false;
  selectedQuotationId: number | null = null;

  constructor(private retailService: RetailService) {}

  ngOnInit(): void {
    this.loading = true;
    this.retailService.getActiveQuotations().subscribe({
      next: quotations => {
        this.quotations = quotations;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSelectionChange(quotationId: number): void {
    this.quotationIdSelected.emit(quotationId);
  }
}
