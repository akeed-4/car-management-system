import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CostCenter, CostCenterEntry, CreateCostCenterDto, UpdateCostCenterDto, CreateCostCenterEntryDto } from '../types/cost-center.model';

@Injectable({
  providedIn: 'root'
})
export class CostCenterService {
  private costCentersSubject = new BehaviorSubject<CostCenter[]>([]);
  private entriesSubject = new BehaviorSubject<CostCenterEntry[]>([]);

  public costCenters$ = this.costCentersSubject.asObservable();
  public entries$ = this.entriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSampleData();
  }

  // Cost Center CRUD
  getCostCenters(): Observable<CostCenter[]> {
    return this.costCenters$;
  }

  getCostCenterById(id: number): Observable<CostCenter | undefined> {
    return this.costCenters$.pipe(
      map(centers => centers.find(c => c.id === id))
    );
  }

  getCostCentersByCarId(carId: number): Observable<CostCenter[]> {
    return this.costCenters$.pipe(
      map(centers => centers.filter(c => c.carId === carId))
    );
  }

  createCostCenter(dto: CreateCostCenterDto): Observable<CostCenter> {
    const newCenter: CostCenter = {
      id: Date.now(),
      ...dto,
      totalCosts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const current = this.costCentersSubject.value;
    this.costCentersSubject.next([...current, newCenter]);
    return of(newCenter);
  }

  updateCostCenter(dto: UpdateCostCenterDto): Observable<CostCenter> {
    const current = this.costCentersSubject.value;
    const index = current.findIndex(c => c.id === dto.id);
    if (index !== -1) {
      const updated = { ...current[index], ...dto, updatedAt: new Date() };
      current[index] = updated;
      this.costCentersSubject.next([...current]);
      return of(updated);
    }
    throw new Error('Cost center not found');
  }

  deleteCostCenter(id: number): Observable<void> {
    const current = this.costCentersSubject.value;
    const filtered = current.filter(c => c.id !== id);
    this.costCentersSubject.next(filtered);
    return of(void 0);
  }

  // Cost Center Entries
  getEntriesByCostCenter(costCenterId: number): Observable<CostCenterEntry[]> {
    return this.entries$.pipe(
      map(entries => entries.filter(e => e.costCenterId === costCenterId))
    );
  }

  createEntry(dto: CreateCostCenterEntryDto): Observable<CostCenterEntry> {
    const newEntry: CostCenterEntry = {
      id: Date.now(),
      costCenterId: dto.costCenterId,
      entryDate: dto.entryDate,
      description: dto.description,
      costType: dto.costType,
      amount: dto.amount,
      referenceNumber: dto.referenceNumber,
      documentUrl: dto.documentUrl,
      notes: dto.notes,
      costCenterName: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const current = this.entriesSubject.value;
    this.entriesSubject.next([...current, newEntry]);
    
    // Update total costs
    this.updateCostCenterTotal(dto.costCenterId, dto.amount);
    
    return of(newEntry);
  }

  deleteEntry(id: number): Observable<void> {
    const current = this.entriesSubject.value;
    const entry = current.find(e => e.id === id);
    if (entry) {
      this.updateCostCenterTotal(entry.costCenterId, -entry.amount);
    }
    const filtered = current.filter(e => e.id !== id);
    this.entriesSubject.next(filtered);
    return of(void 0);
  }

  private updateCostCenterTotal(costCenterId: number, amountDelta: number): void {
    const centers = this.costCentersSubject.value;
    const center = centers.find(c => c.id === costCenterId);
    if (center) {
      center.totalCosts += amountDelta;
      center.updatedAt = new Date();
      this.costCentersSubject.next([...centers]);
    }
  }

  private loadSampleData(): void {
    const sampleCostCenters: CostCenter[] = [
      {
        id: 1,
        code: 'CC-001',
        name: 'Vehicle Operations',
        nameAr: 'عمليات المركبات',
        description: 'General vehicle operations cost center',
        isActive: true,
        totalCosts: 15000,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-12-10')
      },
      {
        id: 2,
        code: 'CC-002',
        name: 'Maintenance Department',
        nameAr: 'قسم الصيانة',
        description: 'Vehicle maintenance and repairs',
        parentId: 1,
        parentName: 'Vehicle Operations',
        isActive: true,
        totalCosts: 8500,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-12-12')
      },
      {
        id: 3,
        code: 'CC-CAR-12345',
        name: 'Toyota Camry 2024',
        nameAr: 'تويوتا كامري 2024',
        description: 'Cost center for VIN: 1HGBH41JXMN109186',
        carId: 1,
        carVin: '1HGBH41JXMN109186',
        carInfo: '2024 Toyota Camry',
        isActive: true,
        totalCosts: 5200,
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-12-13')
      }
    ];

    const sampleEntries: CostCenterEntry[] = [
      {
        id: 1,
        costCenterId: 3,
        costCenterName: 'Toyota Camry 2024',
        entryDate: new Date('2025-11-01'),
        description: 'Engine oil change and filter replacement',
        costType: 'Maintenance',
        amount: 850,
        referenceNumber: 'MNT-2025-001',
        createdAt: new Date('2025-11-01'),
        updatedAt: new Date('2025-11-01')
      },
      {
        id: 2,
        costCenterId: 3,
        costCenterName: 'Toyota Camry 2024',
        entryDate: new Date('2025-11-15'),
        description: 'Ownership transfer registration',
        costType: 'Ownership Transfer',
        amount: 1500,
        referenceNumber: 'OWN-2025-045',
        createdAt: new Date('2025-11-15'),
        updatedAt: new Date('2025-11-15')
      },
      {
        id: 3,
        costCenterId: 3,
        costCenterName: 'Toyota Camry 2024',
        entryDate: new Date('2025-12-01'),
        description: 'Comprehensive insurance coverage',
        costType: 'Insurance',
        amount: 2850,
        referenceNumber: 'INS-2025-234',
        createdAt: new Date('2025-12-01'),
        updatedAt: new Date('2025-12-01')
      }
    ];

    this.costCentersSubject.next(sampleCostCenters);
    this.entriesSubject.next(sampleEntries);
  }
}
