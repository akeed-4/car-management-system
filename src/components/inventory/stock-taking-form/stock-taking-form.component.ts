import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { StockTakeService } from '../../../services/stock-take.service';
import { StockTake } from '../../../types/stock-take.model';
import { StockTakeItem } from '../../../types/stock-take-item.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-stock-taking-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    DxDataGridModule
  ],
  templateUrl: './stock-taking-form.component.html',
  styleUrl: './stock-taking-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private stockTakeService = inject(StockTakeService);
  private translate = inject(TranslateService);

  stockTakeForm!: FormGroup;
  items = signal<StockTakeItem[]>([]);

  // Table columns
  // displayedColumns = ['car', 'systemQuantity', 'actualQuantity', 'actions'];

  editMode = signal(false);
  pageTitle = signal('إنشاء مستند جرد جديد');

  allCars = this.inventoryService.cars$;
  
  // Get a list of car IDs that are already in the items list to disable them in dropdowns
  selectedCarIds = computed(() => {
    const items = this.stockTakeForm?.get('items') as FormArray;
    if (!items) return [];
    return items.controls
      .map(control => control.get('carId')?.value)
      .filter(id => id && id !== 0);
  });

  ngOnInit() {
    this.initForm();
    
    // Handle route params for editing
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل مستند الجرد');
      this.stockTakeService.getStockTakeById(id).subscribe(existingDoc => {
        this.populateForm(existingDoc);
      }, error => {
        console.error('Error loading stock take:', error);
        this.router.navigate(['/inventory/stock-taking']);
      });
    }
  }

  private initForm() {
    this.stockTakeForm = new FormGroup({
      documentCode: new FormControl('', Validators.required),
      documentDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      createdBy: new FormControl('', Validators.required),
      notes: new FormControl(''),
      status: new FormControl('Draft', Validators.required)
    });
  }

  private populateForm(stockTake: StockTake) {
    this.stockTakeForm.patchValue({
      documentCode: stockTake.documentCode,
      documentDate: stockTake.documentDate,
      createdBy: stockTake.createdBy,
      notes: stockTake.notes,
      status: stockTake.status
    });
    this.items.set([...stockTake.items]);
  }

  addNewItemRow() {
    const newItem: StockTakeItem = {
      itemId: 0,
      itemName: '',
      category: '',
      quantityCounted: 0,
      unitCost: 0,
      totalCost: 0,
      notes: ''
    };
    this.items.update(items => [...items, newItem]);
  }

  removeItem(index: number) {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  updateItemDetails(itemId: number, index: number) {
    // This would typically fetch item details from inventory service
    // For now, we'll assume item details are entered manually
  }

  updateTotalCost(index: number) {
    this.items.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      item.totalCost = item.quantityCounted * item.unitCost;
      return updatedItems;
    });
  }

  onCellValueChanged(event: any) {
    if (event.column.dataField === 'quantityCounted' || event.column.dataField === 'unitCost') {
      const rowIndex = event.rowIndex;
      this.updateTotalCost(rowIndex);
    }
  }

  saveStockTake() {
    if (this.stockTakeForm.invalid) {
      return;
    }

    const formValue = this.stockTakeForm.value;
    
    if (this.items().length === 0) {
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_NO_ITEMS'));
      return;
    }

    // Validate that all rows have an item selected
    if (this.items().some(item => item.itemId === 0)) {
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_SELECT_ITEM'));
      return;
    }

    const stockTakeData: StockTake = {
      id: this.editMode() ? 0 : undefined, // Will be set by service for new items
      documentCode: formValue.documentCode,
      documentDate: formValue.documentDate,
      createdBy: formValue.createdBy,
      notes: formValue.notes,
      status: formValue.status,
      items: this.items()
    };

    if (this.editMode()) {
      this.stockTakeService.updateStockTake(stockTakeData);
    } else {
      const { id, status, ...newDoc } = stockTakeData;
      this.stockTakeService.addStockTake(newDoc as Omit<StockTake, 'id' | 'status'>);
    }
    this.router.navigate(['/inventory/stock-taking']);
  }
}