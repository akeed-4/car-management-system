import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { PreparationCharge } from '../../../models/preparation-charge.model';
import { InventoryService } from '../../../services/inventory.service';
import { SalesService } from '../../../services/sales.service';
import { MatIconModule } from '@angular/material/icon';

interface PreparationItem {
  name: string;
  price: number;
  selected: boolean;
}

@Component({
  selector: 'app-preparation-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatListModule,
    TranslateModule,
    MatIconModule
  ],
  templateUrl: './preparation-management.component.html',
  styleUrls: ['./preparation-management.component.css']
})
export class PreparationManagementComponent implements OnInit {
  preparationForm: FormGroup;
  cars = this.inventoryService.cars$;

  preparationItems: PreparationItem[] = [
    { name: 'Tamm Fees', price: 500, selected: false },
    { name: 'Plate Issuance', price: 200, selected: false },
    { name: 'Window Tinting', price: 300, selected: false },
    { name: 'Interior Protection', price: 400, selected: false }
  ];

  totalPreparationFees = 0;

  cardLayout = this.breakpointObserver.observe([
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
        columns: 2,
        miniCard: { cols: 1, rows: 1 }
      };
    })
  );

  constructor(
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private inventoryService: InventoryService,
    private salesService: SalesService
  ) {
    this.preparationForm = this.fb.group({
      vehicleId: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSelectionChange(): void {
    this.totalPreparationFees = this.preparationItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.price, 0);
  }

  onSave(): void {
    if (this.preparationForm.valid) {
      const vehicleId = this.preparationForm.value.vehicleId;
      const selectedItems = this.preparationItems.filter(item => item.selected);

      const charges: PreparationCharge[] = selectedItems.map(item => ({
        vehicleId,
        itemName: item.name,
        price: item.price,
        status: 'Pending',
        createdDate: new Date().toISOString()
      }));

      this.salesService.savePreparationCharges(charges).subscribe({
        next: () => {
          console.log('Preparation charges saved successfully');
          // Navigate to sales invoice with vehicleId
          this.router.navigate(['/sales/invoice/new'], { queryParams: { vehicleId } });
        },
        error: (error) => {
          console.error('Failed to save preparation charges', error);
        }
      });
    }
  }
}