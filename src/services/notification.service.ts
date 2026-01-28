import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private toastr: ToastrService,private translateService: TranslateService) {}

  showSuccess(message: string,title?: string) {
    if(title == null){
      title = this.translateService.instant('notification.successTitle')
    }
    this.toastr.success(message, title, {
      positionClass: this.translateService.currentLang == 'ar' ? 'toast-bottom-right' : 'toast-bottom-left',
      closeButton: true,
      timeOut: 8000,
      toastClass: 'ngx-toastr custom-success-toast',
      disableTimeOut: false,
      tapToDismiss: true,
      progressBar: true,
      progressAnimation: 'decreasing',
      enableHtml: true
    });
  }

  showError(message: string,title?: string) {
    if(title == null){
      title = this.translateService.instant('notification.errorTitle')
    }
    this.toastr.error(message, title, {
      positionClass: this.translateService.currentLang == 'ar' ? 'toast-bottom-right' : 'toast-bottom-left',
      closeButton: true,
      timeOut: 15000,
      toastClass: 'ngx-toastr custom-error-toast',
      disableTimeOut: false,
      tapToDismiss: true,
      progressBar: true,
      progressAnimation: 'decreasing',
      enableHtml: true
    });
  }

  showInfo(message: string,title?: string) {
    this.toastr.info(message, title, {
      positionClass: this.translateService.currentLang == 'ar' ? 'toast-bottom-right' : 'toast-bottom-left',
      closeButton: true,
      timeOut: 8000,
      toastClass: 'ngx-toastr custom-info-toast'
    });
  }

  showWarning(message: string,title?: string) {
    if(title == null){
      title = this.translateService.instant('notification.warningTitle')
    }
    this.toastr.warning(message, title, {
      positionClass: this.translateService.currentLang == 'ar' ? 'toast-bottom-right' : 'toast-bottom-left',
      closeButton: true,
      timeOut: 15000,
      toastClass: 'ngx-toastr custom-warning-toast'
    });
  }

  public async confirmAlert(title: string, text?: string, confirmButtonText?: string) {
    return Swal.fire({
      title: title || this.translateService.instant('notification.confirmTitle'),
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmButtonText || this.translateService.instant('notification.yes'),
      cancelButtonText: this.translateService.instant('notification.cancel'),
      allowOutsideClick: false,
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33',
      didOpen: (dialog) => {
        // Ensure the SweetAlert dialog appears on top of Material dialogs
        const backdrop = document.querySelector('.swal2-backdrop-show') as HTMLElement;
        const alertContainer = document.querySelector('.swal2-container') as HTMLElement;
        if (backdrop) {
          backdrop.style.zIndex = '9999';
        }
        if (alertContainer) {
          alertContainer.style.zIndex = '10000';
        }
      }
    });
  }

  public async confirmWith2Options(title: string, text?: string, option1?: string, option2?: string,cancelOption?:string) {
      return Swal.fire({
      title: title || this.translateService.instant('notification.warningTitle'),
      text: text,
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: option1,
      denyButtonText: option2,
      cancelButtonText: cancelOption,
      allowOutsideClick: false,
      didOpen: (dialog) => {
        // Ensure the SweetAlert dialog appears on top of Material dialogs
        const backdrop = document.querySelector('.swal2-backdrop-show') as HTMLElement;
        const alertContainer = document.querySelector('.swal2-container') as HTMLElement;
        if (backdrop) {
          backdrop.style.zIndex = '9999';
        }
        if (alertContainer) {
          alertContainer.style.zIndex = '10000';
        }
      }
    });
  }

  public async confirmAlertWithInput(title: string, text?: string) {
    return Swal.fire({
      title: title ||this.translateService.instant('notification.confirmTitle'),
      text: text,
      input: 'text',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translateService.instant('notification.yes'),
      cancelButtonText: this.translateService.instant('notification.cancel'),
      allowOutsideClick: false,
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33',
  });
  }

  public async warningAlert(title: string, text?: string) {
    return Swal.fire({
      title: title || this.translateService.instant('notification.warningTitle'),
      text: text,
      icon: 'warning',
      showCancelButton: false,
      confirmButtonText: this.translateService.instant('notification.ok'),
      cancelButtonText: this.translateService.instant('notification.cancel'),
      allowOutsideClick: false
    });
  }

  public async successAlert(title: string, text?: string) {
    return Swal.fire({
      position: 'center',
      icon: 'success',
      title: title || this.translateService.instant('notification.successTitle'),
      text : text || this.translateService.instant('notification.successText'),
      showConfirmButton: true,
      confirmButtonText: this.translateService.instant('notification.ok'),
    })
  }

  public async errorAlert(title: string, text?: string) {
    return Swal.fire({
      position: 'center',
      icon: 'error',
      title: title || this.translateService.instant('notification.errorTitle'),
      text : text || this.translateService.instant('notification.errorText'),
      showConfirmButton: true,
      confirmButtonText: this.translateService.instant('notification.ok'),
    })
  }
}
