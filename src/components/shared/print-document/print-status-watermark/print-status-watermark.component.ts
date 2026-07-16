import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Diagonal Draft/Approved/Cancelled/Rejected overlay, driven by whatever status label/color
 * the caller's adapter already resolved -- no knowledge of DocumentStatus vs PoStatus here. */
@Component({
  selector: 'app-print-status-watermark',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-status-watermark.component.html',
  styleUrl: './print-status-watermark.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintStatusWatermarkComponent {
  @Input() label?: string;
  @Input() color = '#9e9e9e';
}
