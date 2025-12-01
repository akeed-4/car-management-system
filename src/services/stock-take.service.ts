import { Injectable, signal } from '@angular/core';
import { StockTake } from '../types/stock-take.model';

@Injectable({
  providedIn: 'root',
})
export class StockTakeService {
  private nextId = signal(1);
  private stockTakes = signal<StockTake[]>([]);

  public stockTakes$ = this.stockTakes.asReadonly();

  getStockTakeById(id: number): StockTake | undefined {
    return this.stockTakes().find(st => st.id === id);
  }

  addStockTake(stockTake: Omit<StockTake, 'id' | 'status'>) {
    const newStockTake: StockTake = {
      ...stockTake,
      id: this.nextId(),
      status: 'Pending',
    };
    this.stockTakes.update(sts => [...sts, newStockTake]);
    this.nextId.update(id => id + 1);
  }

  updateStockTake(updatedStockTake: StockTake) {
    this.stockTakes.update(sts =>
      sts.map(st => st.id === updatedStockTake.id ? updatedStockTake : st)
    );
  }

  updateStockTakeStatus(id: number, status: 'Pending' | 'Approved') {
    this.stockTakes.update(sts =>
      sts.map(st => st.id === id ? { ...st, status } : st)
    );
  }

  deleteStockTake(id: number) {
    this.stockTakes.update(sts => sts.filter(st => st.id !== id));
  }
}