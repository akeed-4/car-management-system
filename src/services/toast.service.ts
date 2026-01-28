import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private containerId: string | null = null;

  constructor(
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // Set a specific container for toast notifications
  setContainer(containerId: string): void {
    this.containerId = containerId;
  }

  // Clear the container setting (use global)
  clearContainer(): void {
    this.containerId = null;
  }

  private getOptions(timeOut: number, extraClass: string = '') {
    const options: any = {
      timeOut,
      positionClass: this.translate.currentLang === 'ar' ? 'toast-top-right' : 'toast-top-left',
      progressBar: true,
      closeButton: true
    };

    if (this.containerId) {
      options.containerId = this.containerId;
      options.positionClass = this.translate.currentLang === 'ar' ? 'toast-top-right' : 'toast-top-left';
    }

    if (extraClass) {
      options.toastClass = extraClass;
    }

    return options;
  }

  showSuccess(message: string, duration: number = 3000): void {
    const translatedMessage = this.translate.instant(message);
    const translatedTitle = this.translate.instant('TOAST.SUCCESS');
    this.toastr.success(translatedMessage, translatedTitle, this.getOptions(duration, 'toast-success'));
  }

  showWarning(message: string, duration: number = 3000): void {
    const translatedMessage = this.translate.instant(message);
    const translatedTitle = this.translate.instant('TOAST.WARNING');
    this.toastr.warning(translatedMessage, translatedTitle, this.getOptions(duration, 'toast-warning'));
  }

  showError(message: string, duration: number = 5000): void {
    const translatedMessage = this.translate.instant(message);
    const translatedTitle = this.translate.instant('TOAST.ERROR');
    this.toastr.error(translatedMessage, translatedTitle, this.getOptions(duration, 'toast-error'));
  }

  showInfo(message: string, duration: number = 3000): void {
    const translatedMessage = this.translate.instant(message);
    const translatedTitle = this.translate.instant('TOAST.INFO') || 'Info';
    this.toastr.info(translatedMessage, translatedTitle, this.getOptions(duration, 'toast-info'));
  }
}
