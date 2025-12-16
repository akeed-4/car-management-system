import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-car-declaration-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule,
    TranslateModule,
    ReactiveFormsModule
  ],
  templateUrl: './car-declaration-dialog.component.html',
  styleUrl: './car-declaration-dialog.component.css'
})
export class CarDeclarationDialogComponent {
  private dialogRef = inject(MatDialogRef<CarDeclarationDialogComponent>);
  private translate = inject(TranslateService);

  acceptDeclarationControl = new FormControl(false);
  hasSignature = false;
  isDrawing = false;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  ngAfterViewInit() {
    // Initialize canvas after view is ready
    setTimeout(() => {
      this.canvas = document.querySelector('.signature-canvas') as HTMLCanvasElement;
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
      }
    });
  }

  startDrawing(event: MouseEvent) {
    if (!this.canvas) return;
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    this.hasSignature = true;
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.hasSignature = false;
    }
  }

  onConfirm() {
    if (this.acceptDeclarationControl.value && this.hasSignature) {
      this.dialogRef.close(true);
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}