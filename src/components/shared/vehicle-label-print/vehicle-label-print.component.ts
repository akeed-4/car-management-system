import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryService } from '../../../services/inventory.service';
import { PublicVehicleService } from '../../../services/public-vehicle.service';
import { VehicleQrService } from '../../../services/vehicle-qr.service';
import { Car } from '../../../models/car.model';

/**
 * Vehicle label / stock-sticker print page -- a new sibling of InvoicePrintComponent, not an
 * extension of it (a label is a genuinely different, much smaller document). Same conventions:
 * bare route outside LayoutComponent (see app.routes.ts), auto-print on load, closes itself after
 * printing since it's always opened in its own tab. A6, one label per page (see @page in the CSS).
 *
 * Reuses PublicVehiclesController's PublicId (via car.publicId) for the QR -- the SAME public URL
 * a customer would reach by scanning the label also works from the public vehicle page directly.
 * The QR here is a plain URL payload (VehicleQrService), deliberately not QrCodeService's
 * ZATCA/invoice-shaped payload builder.
 */
@Component({
  selector: 'app-vehicle-label-print',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './vehicle-label-print.component.html',
  styleUrl: './vehicle-label-print.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleLabelPrintComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private inventoryService = inject(InventoryService);
  private publicVehicleService = inject(PublicVehicleService);
  private vehicleQrService = inject(VehicleQrService);

  car = signal<Car | null>(null);
  qrDataUrl = signal<string | null>(null);
  loading = signal(true);
  notFound = signal(false);

  private hasAutoPrinted = false;

  constructor() {
    window.onafterprint = () => window.close();
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    if (!idParam) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.inventoryService.getCarById(Number(idParam)).subscribe({
      next: async (car) => {
        this.car.set(car);
        this.loading.set(false);
        if (car.publicId) {
          const url = this.publicVehicleService.buildPublicUrl(car.publicId);
          this.qrDataUrl.set(await this.vehicleQrService.generateDataUrl(url, 220));
        }
        this.triggerAutoPrint();
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private triggerAutoPrint(): void {
    if (this.hasAutoPrinted) return;
    this.hasAutoPrinted = true;
    setTimeout(() => window.print(), 300);
  }

  print(): void {
    window.print();
  }

  firstPhoto(car: Car): string | null {
    return Array.isArray(car.photos) && car.photos.length > 0 ? car.photos[0] : null;
  }
}
