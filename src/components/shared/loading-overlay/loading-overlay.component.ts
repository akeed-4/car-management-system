import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../../services/loading.service';

/** Global overlay shown for the duration of every HTTP request (see LoadingInterceptor).
 *  Mounted once in app.component.html, above the router outlet, so it covers both the
 *  unauthenticated (login) and authenticated (shell) parts of the app alike. */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent {
  private loadingService = inject(LoadingService);
  isLoading = this.loadingService.isLoading;
}
