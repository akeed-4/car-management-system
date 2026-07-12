export function getDailyEntryStatusClass(status: string): string {
  switch (status) {
    case 'Completed': return 'status-chip-completed';
    case 'Pending': return 'status-chip-pending';
    case 'Cancelled': return 'status-chip-cancelled';
    default: return 'status-chip-default';
  }
}

export function getDailyEntryTypeClass(entryType: string): string {
  switch (entryType) {
    case 'Receiving': return 'type-chip-receiving';
    case 'Delivery': return 'type-chip-delivery';
    case 'Transfer': return 'type-chip-transfer';
    case 'Return': return 'type-chip-return';
    case 'Inspection': return 'type-chip-inspection';
    case 'Maintenance': return 'type-chip-maintenance';
    default: return 'type-chip-default';
  }
}
