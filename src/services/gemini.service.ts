import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PriceSuggestion } from '../types/price-suggestion.model';
import { Car } from '../types/car.model';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private apiUrl = 'https://your-api-endpoint.com/generate'; // ضع هنا رابط API الخاص بك
  private apiKey = 'YOUR_API_KEY'; // أو خزن في environment

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    });
  }

  async generateCarDescription(carDetails: string): Promise<string> {
    const payload = {
      model: 'gemini-2.5-flash',
      prompt: `Write a professional sales description in English for a car dealership in Saudi Arabia. Details: ${carDetails}`,
      temperature: 0.7,
    };

    try {
      const obs$ = this.http.post<{ text: string }>(this.apiUrl, payload, { headers: this.getHeaders() });
      const response = await lastValueFrom(obs$);
      return response.text.trim();
    } catch (error) {
      console.error('Error generating description:', error);
      throw new Error('Failed to generate description');
    }
  }

  async suggestPrice(carDetails: Partial<Car>): Promise<PriceSuggestion> {
    const payload = {
      model: 'gemini-2.5-flash',
      prompt: `Suggest a realistic market price range (low, average, high) in SAR for this car:
      Make: ${carDetails.make}, Model: ${carDetails.model}, Year: ${carDetails.year}, Mileage: ${carDetails.mileage} km
      Output JSON only.`,
      temperature: 0.3,
    };

    try {
      const obs$ = this.http.post<{ text: string }>(this.apiUrl, payload, { headers: this.getHeaders() });
      const response = await lastValueFrom(obs$);
      const json = JSON.parse(response.text.trim());
      return json as PriceSuggestion;
    } catch (error) {
      console.error('Error suggesting price:', error);
      throw new Error('Failed to get price suggestion');
    }
  }

  async extractVinFromImage(base64Image: string): Promise<string> {
    const payload = {
      model: 'gemini-2.5-flash',
      prompt: 'Extract the 17-character VIN from this image, return only the VIN',
      imageBase64: base64Image.split(',')[1], // remove data:image/jpeg;base64 prefix
      temperature: 0.1,
    };

    try {
      const obs$ = this.http.post<{ text: string }>(this.apiUrl, payload, { headers: this.getHeaders() });
      const response = await lastValueFrom(obs$);
      const vin = response.text.trim().replace(/[^A-HJ-NPR-Z0-9]/g, '');
      if (vin.length !== 17) throw new Error('Invalid VIN extracted');
      return vin;
    } catch (error) {
      console.error('Error extracting VIN:', error);
      throw new Error('Failed to extract VIN from image');
    }
  }
}
