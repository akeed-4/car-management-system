import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Reusable canvas-based signature capture. Generalized from the inline drawing logic
 * in car-declaration-dialog.component.ts (the only prior art for signatures in this app),
 * with touch support added for tablet use and a base64 PNG output instead of a boolean.
 */
@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignaturePadComponent implements AfterViewInit {
  @Input() label = '';
  /** Emits a base64 PNG data URL on every stroke completion, or null when cleared. */
  @Output() signatureChange = new EventEmitter<string | null>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  hasSignature = false;
  private isDrawing = false;
  private ctx!: CanvasRenderingContext2D;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(ratio, ratio);
    this.ctx.strokeStyle = '#111827';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  private pointFromEvent(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in event ? event.touches[0] : event;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  startDrawing(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isDrawing = true;
    const { x, y } = this.pointFromEvent(event);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.hasSignature = true;
  }

  draw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) {
      return;
    }
    event.preventDefault();
    const { x, y } = this.pointFromEvent(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  stopDrawing(): void {
    if (!this.isDrawing) {
      return;
    }
    this.isDrawing = false;
    this.signatureChange.emit(this.hasSignature ? this.canvasRef.nativeElement.toDataURL('image/png') : null);
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature = false;
    this.signatureChange.emit(null);
  }
}
