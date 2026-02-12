import { Component, OnInit } from '@angular/core';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { PurchaseOffer } from '../../../models/purchase-offer.model';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-purchase-offers',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './purchase-offers.component.html',
  styleUrls: ['./purchase-offers.component.css']
})
export class PurchaseOffersComponent implements OnInit {
  purchaseOffers: PurchaseOffer[] = [];

  constructor(private purchaseCycleService: PurchaseCycleService) { }

  ngOnInit(): void {
    this.loadPurchaseOffers();
  }

  loadPurchaseOffers(): void {
    this.purchaseCycleService.getPurchaseOffers().subscribe(
      data => this.purchaseOffers = data,
      error => console.error('Error loading purchase offers', error)
    );
  }
}