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
    MatTableModule
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

  // Table columns
  displayedColumns = ['car', 'systemQuantity', 'actualQuantity', 'actions'];

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
      name: new FormControl('', Validators.required),
      date: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      user: new FormControl('', Validators.required),
      items: new FormArray([])
    });
  }

  private populateForm(stockTake: StockTake) {
    this.stockTakeForm.patchValue({
      name: stockTake.name,
      date: stockTake.date,
      user: stockTake.user
    });

    const itemsArray = this.stockTakeForm.get('items') as FormArray;
    itemsArray.clear();

    stockTake.items.forEach(item => {
      itemsArray.push(new FormGroup({
        carId: new FormControl(item.carId, Validators.required),
        carDescription: new FormControl(item.carDescription),
        systemQuantity: new FormControl(item.systemQuantity),
        countedQuantity: new FormControl(item.countedQuantity, [Validators.required, Validators.min(0)])
      }));
    });
  }

  get items(): FormArray {
    return this.stockTakeForm.get('items') as FormArray;
  }

  addNewItemRow() {
    const newItem = new FormGroup({
      carId: new FormControl(0, Validators.required),
      carDescription: new FormControl(''),
      systemQuantity: new FormControl(0),
      countedQuantity: new FormControl(0, [Validators.required, Validators.min(0)])
    });
    this.items.push(newItem);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  updateItemCar(carId: number, index: number) {
    this.inventoryService.getCarById(carId).subscribe(car => {
      const itemGroup = this.items.at(index) as FormGroup;
      itemGroup.patchValue({
        carId: car.id,
        carDescription: `${car.make} ${car.model} (${car.year})`,
        systemQuantity: car.quantity,
        countedQuantity: car.quantity // Default counted quantity to system quantity on selection
      });
    });
  }

  updateItemCountedQuantity(quantity: number, index: number) {
    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({
      countedQuantity: quantity >= 0 ? quantity : 0
    });
  }

  saveStockTake() {
    if (this.stockTakeForm.invalid) {
      return;
    }

    const formValue = this.stockTakeForm.value;
    
    if (this.items.length === 0) {
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_NO_ITEMS'));
      return;
    }

    // Validate that all rows have a car selected
    if (this.items.controls.some(control => control.get('carId')?.value === 0)) {
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_SELECT_CAR'));
      return;
    }

    const stockTakeData: StockTake = {
      id: this.editMode() ? 0 : undefined, // Will be set by service for new items
      name: formValue.name,
      date: formValue.date,
      user: formValue.user,
      status: 'Pending',
      items: formValue.items
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