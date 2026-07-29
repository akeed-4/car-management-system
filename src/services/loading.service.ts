import { Injectable, computed, signal } from '@angular/core';

/** Tracks how many HTTP requests are currently in flight -- see LoadingInterceptor, which is
 *  the only thing that calls show()/hide(). A counter (not a boolean) so overlapping requests
 *  don't cause the overlay to disappear the moment the first one finishes. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private activeRequests = signal(0);
  isLoading = computed(() => this.activeRequests() > 0);

  show(): void {
    this.activeRequests.update(count => count + 1);
  }

  hide(): void {
    this.activeRequests.update(count => Math.max(0, count - 1));
  }
}
