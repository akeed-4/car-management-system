import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { PurchaseOffer } from '../../../models/purchase-offer.model';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-purchase-offers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    DxButtonModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './purchase-offers.component.html',
  styleUrls: ['./purchase-offers.component.css']
})
export class PurchaseOffersComponent implements OnInit {
  purchaseOffers: PurchaseOffer[] = [];

  constructor(
    private purchaseCycleService: PurchaseCycleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPurchaseOffers();
  }

  loadPurchaseOffers(): void {
    this.purchaseCycleService.getPurchaseOffers().subscribe({
      next: (offers) => {
        this.purchaseOffers = offers;
      },
      error: (err) => {
        console.error('Error loading purchase offers', err);
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/purchases/offers/new']);
  }

  onEdit(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/offers/edit', id]);
  }
}