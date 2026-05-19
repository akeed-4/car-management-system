/**
 * Invoice Status Enumeration
 * Tracks the lifecycle stages of sales invoices
 */
export enum InvoiceStatus {
  /** Draft - Invoice is being prepared and can still be edited */
  Draft = 1,
  
  /** Approved - Invoice has been approved and is awaiting payment */
  Approved = 2,
  
  /** Paid - Invoice has been fully paid */
  Paid = 3,
  
  /** Delivered - Vehicle has been delivered to customer */
  Delivered = 4
}

/**
 * Helper utility for InvoiceStatus enum
 */
export class InvoiceStatusHelper {
  static getLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      [InvoiceStatus.Draft]: 'SALES_LIFECYCLE.INVOICE_STATUS.DRAFT',
      [InvoiceStatus.Approved]: 'SALES_LIFECYCLE.INVOICE_STATUS.APPROVED',
      [InvoiceStatus.Paid]: 'SALES_LIFECYCLE.INVOICE_STATUS.PAID',
      [InvoiceStatus.Delivered]: 'SALES_LIFECYCLE.INVOICE_STATUS.DELIVERED'
    };
    return labels[status];
  }

  static getColor(status: InvoiceStatus): string {
    const colors: Record<InvoiceStatus, string> = {
      [InvoiceStatus.Draft]: 'gray',
      [InvoiceStatus.Approved]: 'blue',
      [InvoiceStatus.Paid]: 'green',
      [InvoiceStatus.Delivered]: 'purple'
    };
    return colors[status];
  }

  static getAll(): Array<{ value: InvoiceStatus; label: string; color: string }> {
    return [
      { value: InvoiceStatus.Draft, label: this.getLabel(InvoiceStatus.Draft), color: this.getColor(InvoiceStatus.Draft) },
      { value: InvoiceStatus.Approved, label: this.getLabel(InvoiceStatus.Approved), color: this.getColor(InvoiceStatus.Approved) },
      { value: InvoiceStatus.Paid, label: this.getLabel(InvoiceStatus.Paid), color: this.getColor(InvoiceStatus.Paid) },
      { value: InvoiceStatus.Delivered, label: this.getLabel(InvoiceStatus.Delivered), color: this.getColor(InvoiceStatus.Delivered) }
    ];
  }

  static canEdit(status: InvoiceStatus): boolean {
    return status === InvoiceStatus.Draft;
  }

  static canApprove(status: InvoiceStatus): boolean {
    return status === InvoiceStatus.Draft;
  }

  static canPay(status: InvoiceStatus): boolean {
    return status === InvoiceStatus.Approved;
  }

  static canDeliver(status: InvoiceStatus): boolean {
    return status === InvoiceStatus.Paid;
  }
}
