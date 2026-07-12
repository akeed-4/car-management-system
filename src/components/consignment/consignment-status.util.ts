export function getConsignmentStatusClass(status: string): string {
  switch (status) {
    case 'Available': return 'status-chip-available';
    case 'Reserved': return 'status-chip-reserved';
    case 'Sold': return 'status-chip-sold';
    case 'Returned': return 'status-chip-returned';
    default: return 'status-chip-default';
  }
}
