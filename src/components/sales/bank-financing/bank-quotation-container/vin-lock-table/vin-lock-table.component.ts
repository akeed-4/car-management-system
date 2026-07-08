import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../../services/bank-financing.service';
import { VinLockCandidate } from '../../../../../models/bank-financing/bank-quotation.model';

@Component({
  selector: 'app-vin-lock-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatRadioModule, MatIconModule, TranslateModule],
  templateUrl: './vin-lock-table.component.html',
  styleUrls: ['./vin-lock-table.component.css']
})
export class VinLockTableComponent implements OnInit {
  @Output() vinSelected = new EventEmitter<VinLockCandidate | null>();

  candidates: VinLockCandidate[] = [];
  loading = false;
  selectedCarId: number | null = null;
  displayedColumns = ['select', 'vin', 'vehicle', 'price'];

  constructor(private bankFinancingService: BankFinancingService) {}

  ngOnInit(): void {
    this.loading = true;
    this.bankFinancingService.getAvailableVinsForLock().subscribe({
      next: candidates => {
        this.candidates = candidates;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSelect(candidate: VinLockCandidate): void {
    this.selectedCarId = candidate.carId;
    this.vinSelected.emit(candidate);
  }
}
