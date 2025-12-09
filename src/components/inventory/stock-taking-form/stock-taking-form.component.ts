import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../services/inventory.service';
import { StockTakeService } from '../../../services/stock-take.service';
import { StockTake } from '../../../types/stock-take.model';
import { StockTakeItem } from '../../../types/stock-take-item.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-stock-taking-form',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './stock-taking-form.component.html',
  styleUrl: './stock-taking-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private stockTakeService = inject(StockTakeService);
  private translate = inject(TranslateService);

  stockTake = signal<Partial<StockTake>>({
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  editMode = signal(false);
  pageTitle = signal('إنشاء مستند جرد جديد');

  allCars = this.inventoryService.cars$;
  
  // Get a list of car IDs that are already in the items list to disable them in dropdowns
  selectedCarIds = computed(() => {
    return this.stockTake().items?.map(item => item.carId) ?? [];
  });

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) { // Edit mode
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل مستند الجرد');
        this.stockTakeService.getStockTakeById(id).subscribe(existingDoc => {
          this.stockTake.set({ ...existingDoc });
        }, error => {
          console.error('Error loading stock take:', error);
          this.router.navigate(['/inventory/stock-taking']);
        });
      }
      // For new mode, it starts empty by default
    }, { allowSignalWrites: true });
  }

  updateHeaderField<K extends keyof StockTake>(field: K, value: StockTake[K]) {
    this.stockTake.update(st => ({ ...st, [field]: value }));
  }

  addNewItemRow() {
    const newItem: StockTakeItem = {
      carId: 0, // Placeholder
      carDescription: '',
      systemQuantity: 0,
      countedQuantity: 0,
    };
    this.stockTake.update(st => ({ ...st, items: [...(st.items ?? []), newItem] }));
  }

  removeItem(index: number) {
    this.stockTake.update(st => {
      if (!st.items) return st;
      const updatedItems = [...st.items];
      updatedItems.splice(index, 1);
      return { ...st, items: updatedItems };
    });
  }

  updateItemCar(carId: number, index: number) {
    this.inventoryService.getCarById(carId).subscribe(car => {
      const systemQty = car.quantity;

      this.stockTake.update(st => {
        if (!st.items) return st;
        const updatedItems = [...st.items];
        updatedItems[index] = {
          ...updatedItems[index],
          carId: car.id,
          carDescription: `${car.make} ${car.model} (${car.year})`,
          systemQuantity: systemQty,
          countedQuantity: systemQty, // Default counted quantity to system quantity on selection
        };
        return { ...st, items: updatedItems };
      });
    });
  }

  updateItemCountedQuantity(quantity: number, index: number) {
    this.stockTake.update(st => {
      if (!st.items) return st;
      const updatedItems = [...st.items];
      updatedItems[index] = {
        ...updatedItems[index],
        countedQuantity: quantity >= 0 ? quantity : 0,
      };
      return { ...st, items: updatedItems };
    });
  }

  saveStockTake() {
    const stockTakeData = this.stockTake();
    if (!stockTakeData.name || !stockTakeData.user) {
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_NAME_USER'));
      return;
    }

    if (!stockTakeData.items || stockTakeData.items.length === 0) {
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_NO_ITEMS'));
      return;
    }

    // Validate that all rows have a car selected
    if (stockTakeData.items.some(item => item.carId === 0)) {
      alert(this.translate.instant('INVENTORY.STOCK_TAKING_FORM.ERROR_SELECT_CAR'));
      return;
    }

    if (this.editMode()) {
      this.stockTakeService.updateStockTake(stockTakeData as StockTake);
    } else {
      const { id, status, ...newDoc } = stockTakeData;
      this.stockTakeService.addStockTake(newDoc as Omit<StockTake, 'id' | 'status'>);
    }
    this.router.navigate(['/inventory/stock-taking']);
  }
}