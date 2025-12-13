import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  showSuccess(message: string, duration: number = 3000): void {
    const translatedMessage = this.translate.instant(message);
    this.snackBar.open(translatedMessage, this.translate.instant('TOAST.SUCCESS'), {
      duration,
      panelClass: ['toast-success']
    });
  }

  showWarning(message: string, duration: number = 3000): void {
    const translatedMessage = this.translate.instant(message);
    this.snackBar.open(translatedMessage, this.translate.instant('TOAST.WARNING'), {
      duration,
      panelClass: ['toast-warning']
    });
  }

  showError(message: string, duration: number = 5000): void {
    const translatedMessage = this.translate.instant(message);
    this.snackBar.open(translatedMessage, this.translate.instant('TOAST.ERROR'), {
      duration,
      panelClass: ['toast-error']
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    const translatedMessage = this.translate.instant(message);
    this.snackBar.open(translatedMessage, 'Close', {
      duration,
      panelClass: ['toast-info']
    });
  }
}