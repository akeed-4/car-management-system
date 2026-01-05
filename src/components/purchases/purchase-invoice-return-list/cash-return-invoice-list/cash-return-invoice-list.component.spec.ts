import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashReturnInvoiceListComponent } from './cash-return-invoice-list.component';

describe('CashReturnInvoiceListComponent', () => {
  let component: CashReturnInvoiceListComponent;
  let fixture: ComponentFixture<CashReturnInvoiceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashReturnInvoiceListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CashReturnInvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
