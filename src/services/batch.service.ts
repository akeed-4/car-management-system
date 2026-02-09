import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ItemBatch, BatchAllocation, PurchaseItemBatch } from '../models/batch.model';

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private apiUrl = environment.origin + 'api/PurchaseItemBatches';
private batchEndpoint = environment.origin + 'api/ItemBatches';
  constructor(private http: HttpClient) { }

  // Get all batches for an item
  getBatchesByItem(itemId: number): Observable<ItemBatch[]> {
    return this.http.get<ItemBatch[]>(`${this.batchEndpoint}/GetByItem/${itemId}`);
  }

  // Get all available batches for an item (with available quantity > 0)
  getAvailableBatchesByItem(itemId: number): Observable<ItemBatch[]> {
    return this.http.get<ItemBatch[]>(`${this.batchEndpoint}/GetAvailable/${itemId}`);
  }

  // Create new batch
  createBatch(batch: Omit<ItemBatch, 'id' | 'createdAt' | 'updatedAt'>): Observable<ItemBatch> {
    return this.http.post<ItemBatch>(`${this.batchEndpoint}`, batch);
  }

  // Update batch
  updateBatch(id: number, batch: Partial<ItemBatch>): Observable<ItemBatch> {
    return this.http.put<ItemBatch>(`${this.batchEndpoint}/${id}`, batch);
  }

  // Delete batch
  deleteBatch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.batchEndpoint}/${id}`);
  }

  // Allocate batches for purchase invoice item
  allocateBatchesForPurchase(purchaseItemId: number, batchAllocations: BatchAllocation[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/PurchaseItemBatches`, {
      purchaseItemId,
      batchAllocations
    });
  }

  // Get batch allocations for purchase item
  getBatchAllocationsForPurchase(purchaseItemId: number): Observable<PurchaseItemBatch> {
    return this.http.get<PurchaseItemBatch>(`${this.apiUrl}/PurchaseItemBatches/${purchaseItemId}`);
  }

  // Validate batch allocation (ensure total quantity matches)
  validateBatchAllocation(totalRequired: number, allocations: BatchAllocation[]): boolean {
    const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.quantity, 0);
    return totalAllocated === totalRequired;
  }

  // Check if batch exists
  batchExists(itemId: number, batchNo: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/ItemBatches/Exists/${itemId}/${batchNo}`);
  }
}