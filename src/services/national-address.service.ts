import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Country, Region, City, District } from '../models/national-address.model';

/**
 * Requirement 7: Country -> Region -> City -> District dependent dropdowns for the National
 * Address fields on Customer/Supplier. Each getter is scoped to its parent so the frontend can
 * never populate a dropdown with entries unrelated to the level above it.
 */
@Injectable({
  providedIn: 'root'
})
export class NationalAddressService {
  private readonly baseUrl = `${environment.origin}api/NationalAddress`;

  constructor(private http: HttpClient) {}

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.baseUrl}/countries`);
  }

  getRegions(countryId: number): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.baseUrl}/regions?countryId=${countryId}`);
  }

  getCities(regionId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.baseUrl}/cities?regionId=${regionId}`);
  }

  getDistricts(cityId: number): Observable<District[]> {
    return this.http.get<District[]>(`${this.baseUrl}/districts?cityId=${cityId}`);
  }
}
