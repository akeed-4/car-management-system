import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PublicVehicleService } from '../../../services/public-vehicle.service';
import { PublicVehicle } from '../../../models/public-vehicle.model';

/**
 * Anonymous public vehicle page -- reached by scanning a vehicle's QR code / label. No auth guard,
 * no LayoutComponent shell (see app.routes.ts's comment on the print routes for the same pattern).
 * Only ever renders fields from PublicVehicle (the backend's explicit allow-list DTO) -- never
 * fetch or display the internal Car/CarDto here.
 */
@Component({
  selector: 'app-public-vehicle-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './public-vehicle-page.component.html',
  styleUrl: './public-vehicle-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicVehiclePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicVehicleService = inject(PublicVehicleService);

  vehicle = signal<PublicVehicle | null>(null);
  loading = signal(true);
  notFound = signal(false);
  activePhotoIndex = signal(0);

  ngOnInit(): void {
    const publicId = this.route.snapshot.params['publicId'];
    if (!publicId) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.publicVehicleService.getByPublicId(publicId).subscribe({
      next: (vehicle) => {
        this.vehicle.set(vehicle);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  selectPhoto(index: number): void {
    this.activePhotoIndex.set(index);
  }

  /** wa.me deep link built from the dealership's existing Company.Phone -- no separate
   *  "WhatsApp number" field exists or is needed (see audit §platform). Strips everything but
   *  digits since wa.me requires a bare international number with no punctuation. */
  whatsappLink(vehicle: PublicVehicle): string | null {
    if (!vehicle.dealershipPhone) return null;
    const digits = vehicle.dealershipPhone.replace(/[^\d]/g, '');
    if (!digits) return null;
    const message = encodeURIComponent(`${vehicle.make} ${vehicle.model} (${vehicle.year})`);
    return `https://wa.me/${digits}?text=${message}`;
  }
}
