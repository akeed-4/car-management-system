import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CarsReceiptNoteService } from '../../../services/cars-receipt-note.service';
import { CarsReceiptNoteDto } from '../../../models/cars-receipt-note.model';
import { DocumentStatusBadgeComponent } from '../../shared/document-status-badge/document-status-badge.component';

@Component({
  selector: 'app-cars-receipt-note-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    DocumentStatusBadgeComponent
  ],
  templateUrl: './cars-receipt-note-list.component.html',
  styleUrls: ['./cars-receipt-note-list.component.css']
})
export class CarsReceiptNoteListComponent implements OnInit {
  receiptNotes: CarsReceiptNoteDto[] = [];

  constructor(
    private carsReceiptNoteService: CarsReceiptNoteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReceiptNotes();
  }

  loadReceiptNotes(): void {
    this.carsReceiptNoteService.getAll().subscribe({
      next: (notes: any) => {
        this.receiptNotes = Array.isArray(notes) ? notes : (notes?.data ?? []);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading car receipt notes', err);
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/purchases/receipt-notes/new']);
  }

  onView(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/receipt-notes/view', id]);
  }

  getItemsCount(rowData: CarsReceiptNoteDto): number {
    return rowData.items ? rowData.items.length : 0;
  }
}
