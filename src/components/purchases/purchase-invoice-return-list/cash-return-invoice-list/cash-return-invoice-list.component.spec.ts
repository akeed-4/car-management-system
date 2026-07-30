import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CashReturnInvoiceListComponent } from './cash-return-invoice-list.component';

describe('CashReturnInvoiceListComponent', () => {
  let component: CashReturnInvoiceListComponent;
  let fixture: ComponentFixture<CashReturnInvoiceListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // The component injects PurchaseReturnService (which needs HttpClient), TranslateService
      // and Router, so all three have to be available -- the scaffolded spec provided none of
      // them and failed with NullInjectorError before the assertion ever ran.
      imports: [CashReturnInvoiceListComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(CashReturnInvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();

    // The list is loaded via toSignal(...) in a field initializer, so the request is already in
    // flight by construction; flush it so httpMock.verify() has nothing outstanding.
    httpMock.expectOne(request => request.url.includes('PurchaseReturns')).flush([]);
  });
});
