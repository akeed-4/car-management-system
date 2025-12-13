import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InstallmentSchedule, InstallmentReschedule, PaymentRegistration } from '../types/sales-enhancements.model';

@Injectable({
  providedIn: 'root'
})
export class InstallmentService {

  constructor(private http: HttpClient) { }

  // Generate installment schedule preview (client-side calculation)
  generateSchedulePreview(totalAmount: number, downPayment: number, interestRate: number, termMonths: number): Observable<InstallmentSchedule> {
    // Client-side calculation logic here
    // This is a placeholder - implement actual calculation
    return new Observable(observer => {
      const schedule: InstallmentSchedule = {
        id: 0,
        contractId: 0,
        installments: [],
        totalAmount,
        downPayment,
        interestRate,
        termMonths,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      // Calculate installments
      const principal = totalAmount - downPayment;
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        schedule.installments.push({
          id: i,
          dueDate,
          amount: monthlyPayment,
          paid: false,
          overdue: false
        });
      }
      observer.next(schedule);
      observer.complete();
    });
  }

  // API contracts - assume backend exists
  getInstallmentSchedules(): Observable<InstallmentSchedule[]> {
    return this.http.get<InstallmentSchedule[]>('/api/installments');
  }

  getInstallmentSchedule(id: number): Observable<InstallmentSchedule> {
    return this.http.get<InstallmentSchedule>(`/api/installments/${id}`);
  }

  createInstallmentSchedule(schedule: InstallmentSchedule): Observable<InstallmentSchedule> {
    return this.http.post<InstallmentSchedule>('/api/installments', schedule);
  }

  updateInstallmentSchedule(id: number, schedule: InstallmentSchedule): Observable<InstallmentSchedule> {
    return this.http.put<InstallmentSchedule>(`/api/installments/${id}`, schedule);
  }

  rescheduleInstallment(id: number, reschedule: InstallmentReschedule): Observable<InstallmentReschedule> {
    return this.http.post<InstallmentReschedule>(`/api/installments/${id}/reschedule`, reschedule);
  }

  registerPayment(payment: PaymentRegistration): Observable<any> {
    return this.http.post('/api/installments/payments', payment);
  }
}