import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { DailyEntry, DailyEntryType } from '../../../types/daily-entry.model';
import { DailyEntryService } from '../../../services/daily-entry.service';
import { InventoryService } from '../../../services/inventory.service';
import { Car } from '../../../types/car.model';

@Component({
  selector: 'app-daily-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './daily-entry-form.component.html',
  styleUrls: ['./daily-entry-form.component.css']
})
export class DailyEntryFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private dailyEntryService = inject(DailyEntryService);
  private inventoryService = inject(InventoryService);

  entryForm!: FormGroup;
  isEdit = false;
  entryId: number | null = null;
  availableCars: Car[] = [];

  ngOnInit() {
    this.initializeForm();
    this.loadAvailableCars();
    this.checkIfEditMode();
  }

  initializeForm() {
    this.entryForm = this.fb.group({
      entryType: ['', Validators.required],
      carId: ['', Validators.required],
      entryDate: [new Date().toISOString().split('T')[0], Validators.required],
      notes: [''],

      // Maintenance fields
      maintenanceType: [''],
      cost: [0],
      performedBy: [''],
      mileage: [0],
      partsReplaced: [''],
      nextMaintenanceDate: [''],

      // Ownership transfer fields
      previousOwnerName: [''],
      previousOwnerId: [''],
      newOwnerName: [''],
      newOwnerId: [''],
      transferAmount: [0],
      transferDocumentNumber: [''],
      transferDate: [''],

      // Insurance fields
      insuranceCompany: [''],
      policyNumber: [''],
      insuranceType: ['comprehensive'],
      coverageAmount: [0],
      premiumAmount: [0],
      startDate: [''],
      endDate: [''],

      // Periodic inspection fields
      inspectionCenter: [''],
      inspectionResult: ['passed'],
      inspectorName: [''],
      inspectionDate: [''],
      expiryDate: [''],
      violations: [''],
      recommendations: ['']
    });
  }

  loadAvailableCars() {
    // This should ideally come from inventory service
    // For now, using a placeholder
    this.availableCars = [
      { id: 1, make: 'Toyota', model: 'Camry', plateNumber: 'ABC123', vin: '123456789' } as Car,
      { id: 2, make: 'Honda', model: 'Civic', plateNumber: 'XYZ789', vin: '987654321' } as Car
    ];
  }

  checkIfEditMode() {
    const id = this.route.snapshot.params['id'];
    const isEdit = this.route.snapshot.url.some(segment => segment.path === 'edit');

    if (id && isEdit) {
      this.isEdit = true;
      this.entryId = +id;
      this.loadEntryForEdit(this.entryId);
    }
  }

  loadEntryForEdit(id: number) {
    this.dailyEntryService.getById(id).subscribe(entry => {
      this.populateForm(entry);
    });
  }

  populateForm(entry: DailyEntry) {
    this.entryForm.patchValue({
      entryType: entry.entryType,
      carId: entry.carId,
      entryDate: entry.entryDate,
      notes: entry.notes || ''
    });

    // Populate type-specific fields
    switch (entry.entryType) {
      case 'maintenance':
        const maintEntry = entry as any;
        this.entryForm.patchValue({
          maintenanceType: maintEntry.maintenanceType,
          cost: maintEntry.cost,
          performedBy: maintEntry.performedBy,
          mileage: maintEntry.mileage,
          partsReplaced: maintEntry.partsReplaced,
          nextMaintenanceDate: maintEntry.nextMaintenanceDate
        });
        break;

      case 'ownership_transfer':
        const transferEntry = entry as any;
        this.entryForm.patchValue({
          previousOwnerName: transferEntry.previousOwnerName,
          previousOwnerId: transferEntry.previousOwnerId,
          newOwnerName: transferEntry.newOwnerName,
          newOwnerId: transferEntry.newOwnerId,
          transferAmount: transferEntry.transferAmount,
          transferDocumentNumber: transferEntry.transferDocumentNumber,
          transferDate: transferEntry.transferDate
        });
        break;

      case 'insurance':
        const insuranceEntry = entry as any;
        this.entryForm.patchValue({
          insuranceCompany: insuranceEntry.insuranceCompany,
          policyNumber: insuranceEntry.policyNumber,
          insuranceType: insuranceEntry.insuranceType,
          coverageAmount: insuranceEntry.coverageAmount,
          premiumAmount: insuranceEntry.premiumAmount,
          startDate: insuranceEntry.startDate,
          endDate: insuranceEntry.endDate
        });
        break;

      case 'periodic_inspection':
        const inspectionEntry = entry as any;
        this.entryForm.patchValue({
          inspectionCenter: inspectionEntry.inspectionCenter,
          inspectionResult: inspectionEntry.inspectionResult,
          inspectorName: inspectionEntry.inspectorName,
          inspectionDate: inspectionEntry.inspectionDate,
          expiryDate: inspectionEntry.expiryDate,
          violations: inspectionEntry.violations,
          recommendations: inspectionEntry.recommendations
        });
        break;
    }
  }

  onEntryTypeChange() {
    // Reset type-specific fields when entry type changes
    const entryType = this.entryForm.get('entryType')?.value;
    // Could add validation logic here based on entry type
  }

  onSubmit() {
    if (this.entryForm.valid) {
      const formValue = this.entryForm.value;
      const entryData = this.buildEntryData(formValue);

      if (this.isEdit && this.entryId) {
        this.dailyEntryService.updateEntry(this.entryId, entryData).subscribe(() => {
          this.router.navigate(['/daily-entries']);
        });
      } else {
        this.dailyEntryService.createEntry(entryData).subscribe(() => {
          this.router.navigate(['/daily-entries']);
        });
      }
    }
  }

  buildEntryData(formValue: any): Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'> {
    const baseData = {
      carId: formValue.carId,
      entryDate: formValue.entryDate,
      notes: formValue.notes || ''
    } as const;

    switch (formValue.entryType) {
      case 'maintenance': {
        const maintenance = {
          ...baseData,
          entryType: 'maintenance' as const,
          maintenanceType: formValue.maintenanceType || '',
          cost: Number(formValue.cost) || 0,
          performedBy: formValue.performedBy || '',
          mileage: formValue.mileage ? Number(formValue.mileage) : undefined,
          partsReplaced: formValue.partsReplaced ? String(formValue.partsReplaced).split(',').map((s: string) => s.trim()) : undefined,
          nextMaintenanceDate: formValue.nextMaintenanceDate || undefined
        };
        return maintenance as Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>;
      }

      case 'ownership_transfer': {
        const transfer = {
          ...baseData,
          entryType: 'ownership_transfer' as const,
          previousOwnerName: formValue.previousOwnerName || '',
          previousOwnerId: formValue.previousOwnerId || '',
          newOwnerName: formValue.newOwnerName || '',
          newOwnerId: formValue.newOwnerId || '',
          transferAmount: Number(formValue.transferAmount) || 0,
          transferDocumentNumber: formValue.transferDocumentNumber || '',
          transferDate: formValue.transferDate || ''
        };
        return transfer as Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>;
      }

      case 'insurance': {
        const insurance = {
          ...baseData,
          entryType: 'insurance' as const,
          insuranceCompany: formValue.insuranceCompany || '',
          policyNumber: formValue.policyNumber || '',
          insuranceType: formValue.insuranceType || 'comprehensive',
          coverageAmount: Number(formValue.coverageAmount) || 0,
          premiumAmount: Number(formValue.premiumAmount) || 0,
          startDate: formValue.startDate || '',
          endDate: formValue.endDate || ''
        };
        return insurance as Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>;
      }

      case 'periodic_inspection': {
        const inspection = {
          ...baseData,
          entryType: 'periodic_inspection' as const,
          inspectionCenter: formValue.inspectionCenter || '',
          inspectionResult: formValue.inspectionResult || 'passed',
          inspectorName: formValue.inspectorName || '',
          inspectionDate: formValue.inspectionDate || '',
          expiryDate: formValue.expiryDate || '',
          violations: formValue.violations ? String(formValue.violations).split('\n').map((s: string) => s.trim()).filter(Boolean) : undefined,
          recommendations: formValue.recommendations ? String(formValue.recommendations).split('\n').map((s: string) => s.trim()).filter(Boolean) : undefined
        };
        return inspection as Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>;
      }

      default:
        throw new Error('Invalid entry type');
    }
  }

  onCancel() {
    this.router.navigate(['/daily-entries']);
  }
}
