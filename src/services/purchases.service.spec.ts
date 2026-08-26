import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PurchasesService } from './purchases.service';
import { PurchaseInvoice } from '../models/purchase-invoice.model';
import { InvoiceItem } from '../models/invoice-item.model';

describe('PurchasesService - save purchase invoice (addInvoice / updateInvoice)', () => {
  let service: PurchasesService;
  let httpMock: HttpTestingController;

  const items: InvoiceItem[] = [
    {
      carId: 12,
      carDescription: 'Toyota Land Cruiser 2023',
      quantity: 1,
      unitPrice: 200000,
      lineTotal: 200000,
    },
  ];

  /** Matches what PurchaseInvoiceComponent builds before calling addInvoice -- note there are
   * deliberately NO debitAccountId/creditAccountId fields: the backend always derives both
   * accounts server-side and CreatePurchaseInvoiceDto doesn't declare them. */
  const newInvoice = {
    invoiceNumber: 'PI-2026-0001',
    invoiceDate: '2026-08-26',
    supplierId: 7,
    paymentType: 'Cash',
    paymentAccountId: 34,
    storeId: 2,
    branchId: 1,
    invoiceType: 'Taxable',
    totalAmount: 230000,
    subtotal: 200000,
    vatAmount: 30000,
    notes: 'دفعة أولى من المورد',
    status: 'Unpaid',
    items,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PurchasesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('POSTs the invoice payload to api/PurchaseInvoices/Create', done => {
    let saved: PurchaseInvoice | undefined;

    service.addInvoice(newInvoice as never).subscribe(invoice => {
      saved = invoice;
      done();
    });

    const req = httpMock.expectOne(r => r.url.endsWith('/api/PurchaseInvoices/Create'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.supplierId).toBe(7);
    expect(req.request.body.totalAmount).toBe(230000);

    const created = { id: 91, amountPaid: 230000, amountDue: 0, ...newInvoice } as unknown as PurchaseInvoice;
    req.flush(created);

    expect(saved).toEqual(created);
  });

  it('forces isArchived=false on create regardless of caller input', () => {
    service.addInvoice({ ...(newInvoice as any), isArchived: true }).subscribe();

    const req = httpMock.expectOne(r => r.url.endsWith('/api/PurchaseInvoices/Create'));
    expect(req.request.body.isArchived).toBe(false);
    req.flush({} as PurchaseInvoice);
  });

  it('sends line items through untouched', () => {
    service.addInvoice(newInvoice as never).subscribe();

    const req = httpMock.expectOne(r => r.url.endsWith('/api/PurchaseInvoices/Create'));
    expect(req.request.body.items).toEqual(items);
    expect(req.request.body.items.length).toBe(1);
    expect(req.request.body.items[0].lineTotal).toBe(200000);
    req.flush({} as PurchaseInvoice);
  });

  it('PUTs an edited invoice to api/PurchaseInvoices/Update/{id}', () => {
    service.updateInvoice(91, { ...newInvoice, totalAmount: 253000 } as never).subscribe();

    const req = httpMock.expectOne(r => r.url.endsWith('/api/PurchaseInvoices/Update/91'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.totalAmount).toBe(253000);
    expect(req.request.body.isArchived).toBe(false);
    req.flush({} as PurchaseInvoice);
  });
});