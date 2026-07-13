import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BranchService } from './branch.service';
import { StoreService } from './store.service';
import { SupplierService } from './supplier.service';
import { ManufacturerService } from './manufacturer.service';
import { CarModelService } from './car-model.service';
import { CarCategoryService } from './car-category.service';
import { environment } from '../environments/environment';
import { ReportFilters } from '../models/reportmodel/car-report.types';
import { CarReportDataSource } from '../models/reportmodel/car-reports.config';

/** Mirrors CarReportRequest on the backend (Application/DTOs/Reports/CarReportDtos.cs). */
interface CarReportRequestDto {
  companyId?: number | null;
  branchId?: number | null;
  warehouseId?: number | null;
  brandId?: number | null;
  modelId?: number | null;
  categoryId?: number | null;
  supplierId?: number | null;
  color?: string | null;
  status?: string | null;
  vin?: string | null;
  engineNumber?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  year?: number | null;
  salesStatus?: string | null;
}

const DATA_SOURCE_ROUTE: Record<CarReportDataSource, string> = {
  'cars-all': 'cars',
  'cars-current-inventory': 'current-inventory',
  'cars-available': 'available',
  'cars-reserved': 'reserved',
  'cars-sold': 'sold',
  'cars-delivered': 'delivered',
  'requested-cars': 'requested',
  'consignment-cars': 'consignment',
  'daily-entries': 'daily-entries',
  'delivery-schedule': 'delivery-schedule',
  'cars-movement': 'movement',
  'cars-status': 'status',
  'cars-by-branch': 'by-branch',
  'cars-by-warehouse': 'by-warehouse',
  'cars-by-supplier': 'by-supplier',
  'cars-by-brand': 'by-brand',
  'cars-by-model': 'by-model',
  'cars-by-year': 'by-year',
  'cars-by-color': 'by-color',
  'cars-by-vin': 'by-vin',
  'cars-by-engine': 'by-engine',
  'cars-inventory-aging': 'inventory-aging',
  'cars-inventory-valuation': 'inventory-valuation',
  'cars-cost': 'car-cost',
  'cars-profitability': 'car-profitability',
};

/**
 * Central data source for all Car Management reports.
 * Calls the backend CarReportsController (api/CarReports/*), which computes each report
 * server-side via CarReportService (joins Car/ConsignmentCar/RequestedCar/DailyEntry/
 * DeliverySchedule/CarCost through IUnitOfWork) instead of the frontend doing client-side joins.
 */
@Injectable({ providedIn: 'root' })
export class CarReportsDataService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/CarReports';

  private branchService = inject(BranchService);
  private storeService = inject(StoreService);
  private supplierService = inject(SupplierService);
  private manufacturerService = inject(ManufacturerService);
  private carModelService = inject(CarModelService);
  private carCategoryService = inject(CarCategoryService);

  // ---------- Reference data for filter dropdowns ----------

  get branches() { return this.branchService.branches$; }
  get warehouses() { return this.storeService.stores$; }
  get suppliers() { return this.supplierService.suppliers$; }
  get brands() { return this.manufacturerService.manufacturers$; }
  get carModels() { return this.carModelService.carmodel$; }
  get categories() { return this.carCategoryService.categories$; }

  // ---------- Single dispatcher used by the generic report viewer ----------

  /** Calls the matching api/CarReports/{route} endpoint with the current filter panel state. */
  resolveRows(dataSource: CarReportDataSource, filters: ReportFilters): Observable<any[]> {
    const route = DATA_SOURCE_ROUTE[dataSource];
    return this.http.post<any[]>(`${this.apiUrl}/${route}`, this.toRequestDto(filters));
  }

  private toRequestDto(filters: ReportFilters): CarReportRequestDto {
    return {
      companyId: filters.companyId ?? null,
      branchId: filters.branchId ?? null,
      warehouseId: filters.warehouseId ?? null,
      brandId: filters.brandId ?? null,
      modelId: filters.modelId ?? null,
      categoryId: filters.categoryId ?? null,
      supplierId: filters.supplierId ?? null,
      color: filters.color ?? null,
      status: filters.status ?? null,
      vin: filters.vin ?? null,
      engineNumber: filters.engineNumber ?? null,
      dateFrom: filters.dateFrom ?? null,
      dateTo: filters.dateTo ?? null,
      year: filters.year ?? null,
      salesStatus: filters.salesStatus ?? null,
    };
  }
}
