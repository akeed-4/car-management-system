export function getStatusClass(status: string): string {
  switch (status) {
    case 'New': return 'status-chip-new';
    case 'Contacted': return 'status-chip-contacted';
    case 'Sourced': return 'status-chip-sourced';
    case 'Closed': return 'status-chip-closed';
    default: return 'status-chip-default';
  }
}

export function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'Low': return 'priority-chip-low';
    case 'Medium': return 'priority-chip-medium';
    case 'High': return 'priority-chip-high';
    case 'Urgent': return 'priority-chip-urgent';
    default: return 'priority-chip-default';
  }
}

export function getReservationStatusClass(reservationStatus: string): string {
  switch (reservationStatus) {
    case 'NotReserved': return 'reservation-chip-none';
    case 'Reserved': return 'reservation-chip-reserved';
    case 'Confirmed': return 'reservation-chip-confirmed';
    default: return 'reservation-chip-default';
  }
}
