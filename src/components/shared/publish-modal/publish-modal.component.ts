import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Car } from '../../../types/car.model';

type PublishStatus = 'idle' | 'publishing' | 'success' | 'error';

interface Platform {
  name: string;
  icon: string; // SVG path
  status: PublishStatus;
  message: string;
}

@Component({
  selector: 'app-publish-modal',
  standalone: true,
  imports: [],
  templateUrl: './publish-modal.component.html',
  styleUrl: './publish-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishModalComponent {
  isOpen = input.required<boolean>();
  car = input.required<Car | Partial<Car> | null>();
  close = output<void>();

  platforms = signal<Platform[]>([
    { name: 'حراج', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c1.356 0 2.648-.217 3.86-.634M12 21c-1.356 0-2.648-.217-3.86-.634M12 3c1.356 0 2.648.217 3.86.634M12 3c-1.356 0-2.648.217-3.86-.634M12 3v18M3.28 6.747c.563-.827 1.282-1.55 2.126-2.126M3.28 17.253c.563.827 1.282 1.55 2.126 2.126m13.31-12.63c.844.576 1.563 1.299 2.126 2.126m-2.126 10.503c.844-.576 1.563-1.299 2.126-2.126M12 6.345a5.625 5.625 0 0 1 3.86 2.257M12 6.345a5.625 5.625 0 0 0-3.86 2.257m0 0a5.625 5.625 0 0 1 0 5.132m3.86-7.389a5.625 5.625 0 0 1 0 7.389" />', status: 'idle', message: '' },
    { name: 'موتري', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 0 1 3.375-3.375h9.75a3.375 3.375 0 0 1 3.375 3.375v1.875m-17.25 4.5h14.25M9 12.75h6m-6 0a1.5 1.5 0 0 1-1.5-1.5V8.625c0-.828.672-1.5 1.5-1.5h6c.828 0 1.5.672 1.5 1.5v2.625a1.5 1.5 0 0 1-1.5 1.5m-6 0h6" />', status: 'idle', message: '' }
  ]);

  onClose() {
    this.close.emit();
  }

  publish(platformName: string): void {
    this.platforms.update(platforms => 
      platforms.map(p => 
        p.name === platformName ? { ...p, status: 'publishing', message: '' } : p
      )
    );

    // Simulate API call
    setTimeout(() => {
      const isSuccess = Math.random() > 0.3; // 70% chance of success
      this.platforms.update(platforms =>
        platforms.map(p => {
          if (p.name === platformName) {
            return {
              ...p,
              status: isSuccess ? 'success' : 'error',
              message: isSuccess ? 'تم النشر بنجاح.' : 'فشل النشر. حاول مرة أخرى.'
            };
          }
          return p;
        })
      );
    }, 2000);
  }
}
