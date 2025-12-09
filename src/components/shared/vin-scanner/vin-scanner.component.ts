import { ChangeDetectionStrategy, Component, ElementRef, inject, input, OnDestroy, output, signal, viewChild, effect } from '@angular/core';
import { GeminiService } from '../../../services/gemini.service';

@Component({
  selector: 'app-vin-scanner',
  standalone: true,
  imports: [],
  templateUrl: './vin-scanner.component.html',
  styleUrl: './vin-scanner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VinScannerComponent implements OnDestroy {
  private geminiService = inject(GeminiService);

  isOpen = input.required<boolean>();

  vinScanned = output<string>();
  cancel = output<void>();

  videoElement = viewChild<ElementRef<HTMLVideoElement>>('video');
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  
  isProcessing = signal(false);
  error = signal<string | null>(null);
  
  private stream: MediaStream | null = null;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.startCamera();
      } else {
        this.stopCamera();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
  
  private async startCamera() {
    this.error.set(null);
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const video = this.videoElement()?.nativeElement;
      if (video) {
        video.srcObject = this.stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      this.error.set('لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.');
    }
  }

  private stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    const video = this.videoElement()?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
    this.isProcessing.set(false);
  }

  onCancel() {
    this.cancel.emit();
  }

  async capture() {
    this.isProcessing.set(true);
    this.error.set(null);
    
    const video = this.videoElement()?.nativeElement;
    const canvas = this.canvasElement()?.nativeElement;
    
    if (!video || !canvas) {
      this.error.set('Video or canvas element not available.');
      this.isProcessing.set(false);
      return;
    }
    
    const context = canvas.getContext('2d');

    if (!context) {
      this.error.set('Failed to get canvas context.');
      this.isProcessing.set(false);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    try {
      const vin = await this.geminiService.extractVinFromImage(imageData);
      this.vinScanned.emit(vin);
      this.onCancel(); // Close modal on success
    } catch (err) {
      this.error.set(typeof err === 'string' ? err : 'فشل التعرف على الرقم. حاول مرة أخرى.');
      this.isProcessing.set(false);
    }
  }
}
