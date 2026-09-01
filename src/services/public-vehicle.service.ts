import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { PublicVehicle } from '../models/public-vehicle.model';

/** Anonymous read of a vehicle's public page data (api/public/vehicles/{publicId}) -- no auth
 *  token is attached to these calls, matching the backend's [AllowAnonymous] PublicVehiclesController. */
@Injectable({ providedIn: 'root' })
export class PublicVehicleService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/public/vehicles';

  getByPublicId(publicId: string): Observable<PublicVehicle> {
    return this.http.get<PublicVehicle>(`${this.apiUrl}/${publicId}`);
  }

  /** Builds the public URL a vehicle's QR code / label should point to, from the app's own origin
   *  (not the API origin) so scanning it lands on the frontend route, not a bare API JSON response. */
  buildPublicUrl(publicId: string): string {
    return `${window.location.origin}/#/v/${publicId}`;
  }
}
