/** Row for the "Vehicle Delivery Note" invoice-source lookup: un-invoiced deliveries, shared shape for Corporate and Bank. */
export interface UninvoicedDeliveryLookup {
  id: number;
  deliveryNoteNumber: string;
  carId: number;
  vin: string;
  carDescription: string;
  unitPrice: number;
  deliveryDate: string;

  corporateOrderId?: number;
  orderNumber?: string;
  customerId?: number;
  customerName?: string;

  bankQuotationId?: number;
  quotationNumber?: string;
  endUserName?: string;
  bankName?: string;
}
