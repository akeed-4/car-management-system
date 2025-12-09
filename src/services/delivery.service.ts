import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Delivery, ChecklistItem } from '../types/delivery.model';
import { tap } from 'rxjs';
import { InventoryService } from './inventory.service';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private apiUrl = 'http://localhost:5294/api/deliveries';

  private inventoryService = inject(InventoryService);
  private deliveries = signal<Delivery[]>([]);
  public deliveries$ = this.deliveries.asReadonly();

  constructor(private http: HttpClient) {
    this.loadDeliveries();
  }

  /** Load all deliveries */
  loadDeliveries() {
    this.http.get<Delivery[]>(this.apiUrl)
      .pipe(tap(data => this.deliveries.set(data)))
      .subscribe();
  }

  /** Get one delivery by ID (from local signal) */
  getDeliveryById(id: number): Delivery | undefined {
    return this.deliveries().find(d => d.id === id);
  }

  /** Add new delivery */
  addDelivery(delivery: Omit<Delivery, 'id'>) {
    this.http.post<Delivery>(this.apiUrl, delivery)
      .pipe(
        tap(newDelivery => {
          this.deliveries.update(list => [...list, newDelivery]);

          // Update car location
          this.inventoryService.updateCarLocation(newDelivery.carId, 'Out for Delivery Prep');
        })
      )
      .subscribe();
  }

  /** Update existing delivery */
  updateDelivery(delivery: Delivery) {
    this.http.put<Delivery>(`${this.apiUrl}/${delivery.id}`, delivery)
      .pipe(
        tap(updated => {
          this.deliveries.update(list =>
            list.map(d => (d.id === updated.id ? updated : d))
          );

          // Update inventory based on status
          if (updated.status === 'Completed' || updated.status === 'Canceled') {
            this.inventoryService.updateCarLocation(updated.carId, 'In Showroom');
          } else if (updated.status === 'In Progress') {
            this.inventoryService.updateCarLocation(updated.carId, 'Out for Delivery');
          }
        })
      )
      .subscribe();
  }

  /** Update delivery checklist */
  updateDeliveryChecklist(deliveryId: number, updatedChecklist: ChecklistItem[]) {
    const url = `${this.apiUrl}/${deliveryId}/checklist`;

    this.http.put<Delivery>(url, updatedChecklist)
      .pipe(
        tap(updated => {
          this.deliveries.update(list =>
            list.map(d => (d.id === updated.id ? updated : d))
          );
        })
      )
      .subscribe();
  }

  /** Mark delivery as completed */
  completeDelivery(deliveryId: number) {
    const url = `${this.apiUrl}/${deliveryId}/complete`;

    this.http.post<Delivery>(url, {})
      .pipe(
        tap(updated => {
          this.deliveries.update(list =>
            list.map(d => (d.id === updated.id ? updated : d))
          );

          // Update car inventory
          this.inventoryService.updateCarLocation(updated.carId, 'Sold');
        })
      )
      .subscribe();
  }

  /** Delete delivery */
  deleteDelivery(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.deliveries.update(list => list.filter(d => d.id !== id));
        })
      )
      .subscribe();
  }
}
