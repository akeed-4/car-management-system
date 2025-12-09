
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConsignmentService } from '../../../services/consignment.service';
import { ConsignmentCar } from '../../../types/consignment-car.model';

@Component({
  selector: 'app-consignment-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './consignment-form.component.html',
  styleUrl: './consignment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsignmentFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consignmentService = inject(ConsignmentService);

  car = signal<Partial<ConsignmentCar>>({
    status: 'Available',
    commissionRate: 0.05, // Default 5% commission
    dateReceived: new Date().toISOString().split('T')[0],
  });
  editMode = signal(false);
  pageTitle = signal('إضافة سيارة للعهدة');

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات سيارة العهدة');
        this.consignmentService.getById(id).subscribe(existingCar => {
          this.car.set({ ...existingCar });
        }, error => {
          console.error('Error loading consignment car:', error);
          this.router.navigate(['/consignment-cars']);
        });
      }
    });
  }

  updateCarField<K extends keyof ConsignmentCar>(field: K, value: ConsignmentCar[K]) {
    this.car.update(c => ({ ...c, [field]: value }));
  }

  saveConsignmentCar() {
    const carToSave = this.car();

    if (!carToSave.make || !carToSave.model || !carToSave.year || !carToSave.ownerName || !carToSave.ownerPhone || !carToSave.agreedSalePrice || !carToSave.commissionRate) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة.');
      return;
    }

    if (this.editMode()) {
      this.consignmentService.updateConsignmentCar(carToSave as ConsignmentCar);
    } else {
      const { id, ...newCar } = carToSave;
      this.consignmentService.addConsignmentCar(newCar as Omit<ConsignmentCar, 'id'>);
    }
    alert('تم حفظ بيانات سيارة العهدة بنجاح.');
    this.router.navigate(['/consignment-cars']);
  }
}
