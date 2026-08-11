import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { CarCategoryService } from '../../../../services/car-category.service';
import { CarCategory } from '../../../../types/car-category.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';

@Component({
  selector: 'app-car-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    DxDataGridModule,
    TranslateModule,
    MobileCardListComponent
  ],
  templateUrl: './car-category-list.component.html',
  styleUrl: './car-category-list.component.css'
})
export class CarCategoryListComponent {
  private carCategoryService = inject(CarCategoryService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  categories = this.carCategoryService.categories$;

  getCaption(key: string): string {
    return this.translate.instant(`CAR_CATEGORY.COLUMNS.${key}`);
  }

  onEdit(e: any): void {
    this.router.navigate(['/setup/car-category/edit', e.row.data.id]);
  }

  deleteCategory(id: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.carCategoryService.deleteCategory(id).subscribe({
        next: () => {
          console.log('Category deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting category', error);
        }
      });
    }
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (cat: CarCategory) => cat.name;
  mobileTrackBy = (_index: number, cat: CarCategory) => cat.id;

  mobileFields: MobileCardField<CarCategory>[] = [
    { label: 'CAR_CATEGORY.COLUMNS.ID', value: (cat) => cat.id },
    { label: 'CAR_CATEGORY.COLUMNS.DESCRIPTION', value: (cat) => cat.description },
  ];

  mobileEdit(cat: CarCategory): void {
    this.onEdit({ row: { data: { id: cat.id } } });
  }

  mobileDelete(cat: CarCategory): void {
    this.deleteCategory(cat.id);
  }
}
