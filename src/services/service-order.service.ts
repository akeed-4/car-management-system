import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { ServiceOrder } from '../models/service-order.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceOrderService {
  private apiUrl = 'http://localhost:5294/api/serviceorders';

  private serviceOrders = signal<ServiceOrder[]>([]);
  public serviceOrders$ = this.serviceOrders.asReadonly();

  constructor(private http: HttpClient) {
    this.loadServiceOrders();
  }

  /** Load all service orders */
  loadServiceOrders() {
    this.http.get<ServiceOrder[]>(this.apiUrl)
      .pipe(tap(data => this.serviceOrders.set(data)))
      .subscribe();
  }

  /** Get single service order by ID */
  getServiceOrderById(id: number): ServiceOrder | undefined {
    return this.serviceOrders().find(o => o.id === id);
  }

  /** Add new service order */
  addServiceOrder(order: Omit<ServiceOrder, 'id'>) {
    this.http.post<ServiceOrder>(this.apiUrl, order)
      .pipe(
        tap(newOrder => {
          this.serviceOrders.update(list => [...list, newOrder]);
        })
      )
      .subscribe();
  }

  /** Update existing service order */
  updateServiceOrder(order: ServiceOrder) {
    const url = `${this.apiUrl}/${order.id}`;
    this.http.put<ServiceOrder>(url, order)
      .pipe(
        tap(() => {
          this.serviceOrders.update(list =>
            list.map(o => (o.id === order.id ? order : o))
          );
        })
      )
      .subscribe();
  }

  /** Delete service order */
  deleteServiceOrder(id: number) {
    const url = `${this.apiUrl}/${id}`;
    this.http.delete(url)
      .pipe(
        tap(() => {
          this.serviceOrders.update(list => list.filter(o => o.id !== id));
        })
      )
      .subscribe();
  }
}
