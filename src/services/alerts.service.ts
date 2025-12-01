import { Injectable, computed, inject } from '@angular/core';
import { SalesService } from './sales.service';
import { InventoryService } from './inventory.service';
import { UpcomingAlert } from '../types/upcoming-alert.model';
import { Car } from '../types/car.model';

const ALERT_THRESHOLD_DAYS = 30;

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  private salesService = inject(SalesService);
  private inventoryService = inject(InventoryService);

  upcomingAlerts$ = computed<UpcomingAlert[]>(() => {
    const allInvoices = this.salesService.invoices$();
    const allCars = this.inventoryService.cars$();
    const carsMap = new Map<number, Car>(allCars.map(c => [c.id, c]));
    const alerts: UpcomingAlert[] = [];
    const today = new Date();
    // Set time to 0 to compare dates only
    today.setHours(0, 0, 0, 0);

    for (const invoice of allInvoices) {
      for (const item of invoice.items) {
        const car = carsMap.get(item.carId);
        if (!car) continue;

        // 1. Check Istimara Expiry
        if (car.istimaraExpiry) {
          const expiry = new Date(car.istimaraExpiry);
          const diffTime = expiry.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays <= ALERT_THRESHOLD_DAYS) {
            alerts.push({
              customerId: invoice.customerId,
              customerName: invoice.customerName,
              carDescription: `${car.make} ${car.model}`,
              plateNumber: car.plateNumber,
              alertType: 'انتهاء الاستمارة',
              expiryDate: car.istimaraExpiry,
              daysRemaining: diffDays,
            });
          }
        }

        // 2. Check Fahas Expiry (Assumption: 1 year from sale date)
        const saleDate = new Date(invoice.invoiceDate);
        const fahasExpiry = new Date(new Date(saleDate).setFullYear(saleDate.getFullYear() + 1));
        const diffTimeFahas = fahasExpiry.getTime() - today.getTime();
        const diffDaysFahas = Math.ceil(diffTimeFahas / (1000 * 60 * 60 * 24));

        if (diffDaysFahas >= 0 && diffDaysFahas <= ALERT_THRESHOLD_DAYS) {
          alerts.push({
            customerId: invoice.customerId,
            customerName: invoice.customerName,
            carDescription: `${car.make} ${car.model}`,
            plateNumber: car.plateNumber,
            alertType: 'فحص دوري',
            expiryDate: fahasExpiry.toISOString().split('T')[0],
            daysRemaining: diffDaysFahas,
          });
        }
      }
    }
    // Sort by days remaining, ascending
    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  });
}
