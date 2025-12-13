import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { RequestedCarService } from '../../../services/requested-car.service';

@Component({
  selector: 'app-requested-cars',
  standalone: true,
  imports: [RouterLink, DatePipe, ModalComponent],
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
}