import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { SalesRequest, SalesRequestItem } from '../../../models/sales-request.model';

@Component({
  selector: 'app-sales-request-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatGridListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './sales-request-form.component.html',
  styleUrls: ['./sales-request-form.component.css']
})
export class SalesRequestFormComponent implements OnInit {
  salesRequestForm: FormGroup;
  isEditMode = false;
  salesRequestId: number | null = null;

  requestItems: SalesRequestItem[] = [];
  customers: any[] = [];
  requestedCars: any[] = [];

  cardLayout3 = this.breakpointObserver.observe([
    Breakpoints.Handset,
    Breakpoints.Tablet,
    Breakpoints.Web
  ]).pipe(
    map(({ matches }) => {
      if (matches) {
        return {
          columns: 1,
          miniCard: { cols: 1, rows: 1 }
        };
      }
      return {
        columns: 3,
        miniCard: { cols: 1, rows: 1 }
      };
    })
  );

  constructor(
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {
    this.salesRequestForm = this.fb.group({
      requestNumber: ['', Validators.required],
      requestDate: [new Date(), Validators.required],
      customerId: ['', Validators.required],
      descriptionAr: [''],
      descriptionEn: [''],
      referenceNumber: ['']
    });
  }

  ngOnInit(): void {
    // Load initial data
  }

  onSubmit(): void {
    if (this.salesRequestForm.valid && this.requestItems.length > 0) {
      const formValue = {
        ...this.salesRequestForm.value,
        items: this.requestItems
      };

      if (this.isEditMode && this.salesRequestId) {
        // Update logic
        console.log('Updating sales request', formValue);
      } else {
        // Create logic
        console.log('Creating sales request', formValue);
      }
      // Navigate back
      this.router.navigate(['/sales/requests']);
    }
  }

  addNewRow(): void {
    this.requestItems.push({
      carDescription: '',
      quantity: 1,
      requestedPrice: 0,
      notes: ''
    });
    this.requestItems = [...this.requestItems];
  }

  removeItem(e: any): void {
    const index = this.requestItems.indexOf(e.data);
    if (index > -1) {
      this.requestItems.splice(index, 1);
      this.requestItems = [...this.requestItems];
    }
  }

  onCellValueChanged(e: any): void {
    // Handle cell changes
  }

  calculateTotal = (rowData: SalesRequestItem): number => {
    return (rowData.quantity || 0) * (rowData.requestedPrice || 0);
  }

  updateSummary(): void {
    // Update summary logic
  }

  showDetails(): void {
    console.log('Show details clicked');
  }

  showClassification(): void {
    console.log('Show classification clicked');
  }

  searchItems(): void {
    console.log('Search items clicked');
  }

  tableSettings(): void {
    console.log('Table settings clicked');
  }

  toggleHiddenColumns(): void {
    console.log('Toggle hidden columns clicked');
  }
}