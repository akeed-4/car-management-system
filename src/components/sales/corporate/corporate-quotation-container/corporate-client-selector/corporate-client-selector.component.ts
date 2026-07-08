import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { CorporateFleetService } from '../../../../../services/corporate-fleet.service';
import { CorporateClient } from '../../../../../models/corporate/corporate-quotation.model';

@Component({
  selector: 'app-corporate-client-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, TranslateModule],
  templateUrl: './corporate-client-selector.component.html',
  styleUrls: ['./corporate-client-selector.component.css']
})
export class CorporateClientSelectorComponent implements OnInit {
  @Output() clientSelected = new EventEmitter<CorporateClient | null>();

  clients: CorporateClient[] = [];
  loading = false;
  selectedClientId: number | null = null;

  constructor(private corporateFleetService: CorporateFleetService) {}

  ngOnInit(): void {
    this.loading = true;
    this.corporateFleetService.getCorporateClients().subscribe({
      next: clients => {
        this.clients = clients;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSelectionChange(clientId: number): void {
    const client = this.clients.find(c => c.id === clientId) ?? null;
    this.clientSelected.emit(client);
  }
}
