import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { RequestedCarService } from '../../../services/requested-car.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { DxDataGridModule, DxButtonModule, DxTemplateModule, DxTemplateHost } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-requested-cars',
  standalone: true,
  imports: [
    RouterLink,
    ModalComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatSlideToggleModule,
    MatChipsModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
    TranslateModule
  ],
  providers: [DxTemplateHost],
  templateUrl: './requested-cars.component.html',
  styleUrl: './requested-cars.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestedCarsComponent {
  private requestedCarService = inject(RequestedCarService);
  private router = inject(Router);

  requests = this.requestedCarService.requestedCars$;
  showArchived = signal(false);

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  filteredRequests = computed(() => {
    const showArchived = this.showArchived();
    return this.requests().filter(req => !!req.isArchived === showArchived);
  });

  editRequest(id: number) {
    this.router.navigate(['/requested-cars/edit', id]);
  }

  requestDelete(id: number) {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    const id = this.itemToDeleteId();
    if (id) {
      this.requestedCarService.deleteRequest(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }

  archiveRequest(id: number) {
    this.requestedCarService.archiveRequest(id);
  }

  unarchiveRequest(id: number) {
    this.requestedCarService.unarchiveRequest(id);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'New': return 'status-chip-new';
      case 'Contacted': return 'status-chip-contacted';
      case 'Sourced': return 'status-chip-sourced';
      case 'Closed': return 'status-chip-closed';
      default: return 'status-chip-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'New': return 'جديد';
      case 'Contacted': return 'تم التواصل';
      case 'Sourced': return 'تم توفيرها';
      case 'Closed': return 'مغلق';
      default: return status;
    }
  }
}