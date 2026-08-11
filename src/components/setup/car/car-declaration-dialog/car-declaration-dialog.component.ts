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
        // The canvas previously had a hardcoded width="400" HTML attribute, which doesn't shrink
        // with its container -- on a ~360px phone that overflowed the dialog and forced
        // horizontal scroll. Size the backing bitmap to the element's actual (CSS-driven, see
        // .signature-canvas { width: 100% } below) layout width instead, scaled by
        // devicePixelRatio so strokes stay crisp on high-DPI phone screens.
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = this.canvas.clientWidth;
        const cssHeight = this.canvas.clientHeight;
        this.canvas.width = cssWidth * dpr;
        this.canvas.height = cssHeight * dpr;

        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.scale(dpr, dpr);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
      }
    });
  }

  private pointFromEvent(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const point = 'touches' in event ? (event.touches[0] ?? event.changedTouches[0]) : event;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    if (!this.canvas) return;
    event.preventDefault(); // touchstart also fires a synthetic mousedown -- prevent double-handling and page scroll while signing
    this.isDrawing = true;
    const { x, y } = this.pointFromEvent(event);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.hasSignature = true;
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing || !this.canvas) return;
    event.preventDefault();
    const { x, y } = this.pointFromEvent(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature() {
    if (this.ctx && this.canvas) {
      // ctx is scale(dpr, dpr)'d (see ngAfterViewInit), so clearRect must use the logical
      // (CSS/client) size, not the DPR-scaled backing-store canvas.width/height -- otherwise at
      // 2x DPR this only clears the top-left quarter of what's visible.
      this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
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