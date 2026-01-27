export interface UpcomingAlert {
  customerId: number;
  customerName: string;
  carDescription: string;
  plateNumber: string;
  alertType: 'انتهاء الاستمارة' | 'فحص دوري';
  expiryDate: string;
  daysRemaining: number;
}
