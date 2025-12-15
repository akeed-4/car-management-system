import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartOfAccountsTreeComponent } from './chart-of-accounts-tree.component';

describe('ChartOfAccountsTreeComponent', () => {
  let component: ChartOfAccountsTreeComponent;
  let fixture: ComponentFixture<ChartOfAccountsTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartOfAccountsTreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartOfAccountsTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
