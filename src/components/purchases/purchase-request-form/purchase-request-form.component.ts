import { Component } from '@angular/core';
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
import { PurchaseCycleService } from '@/src/services/purchase-cycle.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { PurchaseRequest, PurchaseRequestItem } from '../../../models/purchase-request.model';
import dxDataGrid from 'devextreme/ui/data_grid';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-purchase-request-form',
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
  templateUrl: './purchase-request-form.component.html',
  styleUrls: ['./purchase-request-form.component.css']
})
export class PurchaseRequestFormComponent {
  purchaseOfferForm: FormGroup;
    isEditMode = false;
    purchaseOfferId: number | null = null;
  
    // Data arrays
    offerItems: PurchaseRequestItem[] = [];
    suppliers: any[] = [];
    requestedCars: any[] = [];
    classifiers: any[] = [];
    units: any[] = [];
  
    // Summary properties
    lastPurchasePrice: number = 0;
    salePrice: number = 0;
    taxCostPrice: number = 0;
    unitCostPrice: number = 0;
  
    // Layout observable for responsive design
    cardLayout3: Observable<any>;
  
    constructor(
        private fb: FormBuilder,
        private purchaseCycleService: PurchaseCycleService,
        private router: Router,
        private breakpointObserver: BreakpointObserver
    ) {
        this.purchaseOfferForm = this.fb.group({
            offerNumber: ['', Validators.required],
            offerDate: [new Date(), Validators.required],
            referenceNumber: [''],
            descriptionAr: [''],
            descriptionEn: [''],
            status: ['Pending'],
            notes: ['']
        });
  
    }
  
    ngOnInit(): void {
    
      // Check if editing
      const id = this.router.url.split('/').pop();
      if (id && !isNaN(+id)) {
        this.isEditMode = true;
        this.purchaseOfferId = +id;
        this.loadPurchaseOffer(this.purchaseOfferId);
      }
    }
  


    loadPurchaseOffer(id: number): void {
      this.purchaseCycleService.getPurchaseOffer(id).subscribe(
        data => {
          this.purchaseOfferForm.patchValue(data);
          // TODO: Load offer items
          this.offerItems = [];
        },
        error => console.error('Error loading purchase offer', error)
      );
    }
  
    showDetails(): void {
      // TODO: Implement details view
      console.log('Show details');
    }
  
  
  
  

 
  
  
    toggleHiddenColumns(): void {
      // TODO: Implement hidden columns toggle
      console.log('Toggle hidden columns');
    }
  
    addNewRow(): void {
      const newItem: PurchaseRequestItem =
      {
        carDescription: '',
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0
      };
      this.offerItems = [...this.offerItems, newItem];
    }
  
    removeItem(e: any): void {
      const index = this.offerItems.indexOf(e.data);
      if (index > -1) {
        this.offerItems.splice(index, 1);
        this.offerItems = [...this.offerItems];
      }
    }
  
    onCellValueChanged(e: any): void {
      if (e && e.data) {
        const item = e.data as PurchaseRequestItem;
        item.lineTotal = this.calculateTotal(item);
        // replace the changed item in the array to trigger change detection
        const idx = this.offerItems.indexOf(e.data);
        if (idx > -1) {
          this.offerItems[idx] = item;
        }
      }
      this.updateSummary();
    }
  
    calculateTotal = (rowData: PurchaseRequestItem): number => {
      return (rowData.quantity || 0) * (rowData.unitPrice || 0);
    }
  
  
    updateSummary(): void {
      this.lastPurchasePrice = 0;
      this.salePrice = 0;
      this.taxCostPrice = 0;
      this.unitCostPrice = 0;
  
      this.offerItems.forEach(item => {
        const line = item.lineTotal !== undefined ? item.lineTotal : this.calculateTotal(item);
      });
  
      // Example summary calculations — adapt to business rules as needed
      this.salePrice = this.lastPurchasePrice * 1.15;
      this.taxCostPrice = this.lastPurchasePrice * 0.15;
      this.unitCostPrice = this.offerItems.length > 0 ? this.lastPurchasePrice / this.offerItems.length : 0;
    }
   
  
    showClassification(): void {
      // TODO: Implement show classification functionality
      console.log('Show classification clicked');
    }
  
    searchItems(): void {
      // TODO: Implement search items functionality
      console.log('Search items clicked');
    }
  
    tableSettings(): void {
      // TODO: Implement table settings functionality
      console.log('Table settings clicked');
    }
  
   

      // Calculate summary values
  
    onSubmit(): void {
      if (this.purchaseOfferForm.valid && this.offerItems.length > 0) {
        const formValue = {
          ...this.purchaseOfferForm.value,
          items: this.offerItems
        };
  
        if (this.isEditMode && this.purchaseOfferId) {
          this.purchaseCycleService.updatePurchaseOffer(this.purchaseOfferId, formValue).subscribe(
            () => this.router.navigate(['/purchases/offers']),
            error => console.error('Error updating purchase offer', error)
          );
        } else {
          this.purchaseCycleService.createPurchaseOffer(formValue).subscribe(
            () => this.router.navigate(['/purchases/offers']),
            error => console.error('Error creating purchase offer', error)
          );
        }
      }
    }
  
    onCancel(): void {
      this.router.navigate(['/purchases/offers']);
    }
  }
  