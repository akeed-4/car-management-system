import { InvoiceCreditListComponent } from './invoice-credit-list.component';
export interface CreditInvoiceListItem {
  id: number;
  invoiceNumber: string;
  customer: {
    id: number;
    name: string;
    nationalId?: string;
  };
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  salesperson?: string;
}

export interface creditInvoiceList {
  en: {
    TITLE: string;
    BACK_TO_SALES: string;
    INVOICE_NUMBER: string;
    CUSTOMER: string;
    INVOICE_DATE: string;
    DUE_DATE: string;
    TOTAL_AMOUNT: string;
    PAYMENT_METHOD: string;
    STATUS: string;
    NO_DATA: string;
  };
  ar: {
    TITLE: string;
    BACK_TO_SALES: string;
    INVOICE_NUMBER: string;
    CUSTOMER: string;
    INVOICE_DATE: string;
    DUE_DATE: string;
    TOTAL_AMOUNT: string;
    PAYMENT_METHOD: string;
    STATUS: string;
    NO_DATA: string;
  };
}

export class creditInvoiceLanguageData {
  public static InvoiceCreditListDictionary: creditInvoiceList = {
    en: {
      TITLE: 'Credit Sales Invoices',
      BACK_TO_SALES: 'Back to Sales',
      INVOICE_NUMBER: 'Invoice Number',
      CUSTOMER: 'Customer',
      INVOICE_DATE: 'Invoice Date',
      DUE_DATE: 'Due Date',
      TOTAL_AMOUNT: 'Total Amount',
      PAYMENT_METHOD: 'Payment Method',
      STATUS: 'Status',
      NO_DATA: 'No credit invoices found.'
    },
    ar: {
      TITLE: 'فواتير المبيعات الاجلة',
      BACK_TO_SALES: 'العودة للمبيعات',
      INVOICE_NUMBER: 'رقم الفاتورة',
      CUSTOMER: 'العميل',
      INVOICE_DATE: 'تاريخ الفاتورة',
      DUE_DATE: 'تاريخ الاستحقاق',
      TOTAL_AMOUNT: 'المبلغ الإجمالي',
      PAYMENT_METHOD: 'طريقة الدفع',
      STATUS: 'الحالة',
      NO_DATA: 'لا توجد فواتير ائتمانية.'
    }
  };
}