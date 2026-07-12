import { DeliverySchedule } from '../../models/delivery.model';

export function getDeliveryStatusClass(status: string): string {
  switch (status) {
    case 'Scheduled': return 'status-chip-scheduled';
    case 'InProgress': return 'status-chip-in-progress';
    case 'Completed': return 'status-chip-completed';
    case 'Cancelled': return 'status-chip-cancelled';
    default: return 'status-chip-default';
  }
}

export function isLateDelivery(delivery: DeliverySchedule): boolean {
  if (delivery.status === 'Completed' || delivery.status === 'Cancelled') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deliveryDate = new Date(delivery.deliveryDate);
  deliveryDate.setHours(0, 0, 0, 0);
  return deliveryDate < today;
}

export function isTodayDelivery(delivery: DeliverySchedule): boolean {
  const today = new Date().toISOString().split('T')[0];
  return delivery.deliveryDate?.startsWith(today);
}
