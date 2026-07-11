import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Cross-component "something changed" signals for the purchase cycle screens (offers -> orders). */
@Injectable({
  providedIn: 'root'
})
export class PurchaseCycleRefreshService {
  private poListChangedSource = new Subject<void>();
  private offersChangedSource = new Subject<void>();

  poListChanged$ = this.poListChangedSource.asObservable();
  offersChanged$ = this.offersChangedSource.asObservable();

  notifyPoListChanged(): void {
    this.poListChangedSource.next();
  }

  notifyOffersChanged(): void {
    this.offersChangedSource.next();
  }
}
