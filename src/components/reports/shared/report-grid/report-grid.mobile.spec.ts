import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MatNativeDateModule } from '@angular/material/core';

import { ReportGridComponent, GridColumn } from './report-grid.component';
import { ReportContainerComponent } from '../report-container/report-container.component';
import { ResponsiveService } from '../../../../services/responsive.service';

/** Host mimicking a report screen: binds array dataSource like trial-balance does. */
@Component({
  selector: 'host-comp',
  standalone: true,
  imports: [ReportGridComponent],
  template: `
    <app-report-grid
      [dataSource]="rows"
      [columns]="cols"
      [keyExpr]="'accountId'"
      [allowSorting]="true"
      [allowFiltering]="true"
      [showSummary]="false"
      [noDataText]="'REPORTS.NO_DATA'">
    </app-report-grid>
  `,
})
class HostComponent {
  rows: any[] = [];
  cols: GridColumn[] = [
    { dataField: 'accountCode', caption: 'REPORTS.COLUMNS.ACCOUNT_CODE', dataType: 'string' },
    { dataField: 'accountName', caption: 'REPORTS.COLUMNS.ACCOUNT_NAME', dataType: 'string' },
    { dataField: 'closingDebit', caption: 'REPORTS.COLUMNS.CLOSING_DEBIT', dataType: 'number' },
  ];
}

describe('ReportGridComponent (mobile rendering)', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ResponsiveService, useValue: { isMobile: signal(true), isHandset: signal(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('renders mobile cards for array-mode data after a search', () => {
    fixture.componentInstance.rows = [
      { accountId: 1, accountCode: '1000', accountName: 'Cash', closingDebit: 1300 },
      { accountId: 2, accountCode: '2000', accountName: 'Payable', closingDebit: 0 },
    ];
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('.mobile-card'));
    expect(cards.length).toBe(2);

    const bodyText = fixture.nativeElement.textContent;
    expect(bodyText).toContain('1000');
    expect(bodyText).toContain('Cash');
  });

  it('shows the empty message when there is no data', () => {
    fixture.detectChanges();
    const bodyText = fixture.nativeElement.textContent;
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  it('picks up reassigned array data (new search) without extra prodding', () => {
    fixture.componentInstance.rows = [{ accountId: 1, accountCode: '1000', accountName: 'Cash', closingDebit: 1 }];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cash');

    // Simulate Apply Filter assigning a fresh array (what every report screen does).
    fixture.componentInstance.rows = [
      { accountId: 9, accountCode: '9999', accountName: 'Fresh Row', closingDebit: 42 },
    ];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Fresh Row');
  });
});

/** Integration host: real ReportContainerComponent + real ReportGridComponent, mobile mock --
 *  reproduces the exact mobile report screen structure (ng-content projection through the
 *  container's @if branch into the grid's mobile list). */
@Component({
  selector: 'host-integration',
  standalone: true,
  imports: [ReportContainerComponent, ReportGridComponent],
  template: `
    <app-report-container
      [title]="'REPORTS.TRIAL_BALANCE.TITLE'"
      [loading]="loading"
      (filterChange)="onFilter($event)">
      <ng-template #reportBody>
        <app-report-grid
          [dataSource]="rows"
          [loading]="loading"
          [columns]="cols"
          [keyExpr]="'accountId'"
          [noDataText]="'REPORTS.NO_DATA'">
        </app-report-grid>
      </ng-template>
    </app-report-container>
  `,
})
class HostIntegrationComponent {
  loading = false;
  rows: any[] = [];
  cols: GridColumn[] = [
    { dataField: 'accountCode', caption: 'REPORTS.COLUMNS.ACCOUNT_CODE', dataType: 'string' },
    { dataField: 'accountName', caption: 'REPORTS.COLUMNS.ACCOUNT_NAME', dataType: 'string' },
  ];
  onFilter(_f: unknown): void {
    // What every report screen's onFilterChange does: assign a fresh array from the service.
    this.rows = [{ accountId: 7, accountCode: '7777', accountName: 'Integrated Row', closingDebit: 9 }];
  }
}

describe('ReportContainer + ReportGrid (mobile integration)', () => {
  let fixture: ComponentFixture<HostIntegrationComponent>;
  let httpMock: HttpTestingController;

  /** Store/Accounting/CostCenter services fire real HTTP from their constructors -- flush
   *  whatever is outstanding so httpMock.verify() has nothing pending (same pattern as the
   *  real report-container spec). */
  function flushEagerRequests(): void {
    httpMock.match(() => true).forEach(req => req.flush([]));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostIntegrationComponent, TranslateModule.forRoot(), NoopAnimationsModule, MatNativeDateModule],
      providers: [
        { provide: ResponsiveService, useValue: { isMobile: signal(true), isHandset: signal(true) } },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HostIntegrationComponent);
  });

  afterEach(() => {
    flushEagerRequests();
  });

  it('projects the report grid into the mobile results card and renders data after Apply', () => {
    fixture.detectChanges();

    // Apply Filter button inside the filters card
    const filterActions = fixture.debugElement.queryAll(By.css('.filter-actions button'));
    expect(filterActions.length).toBeGreaterThan(0);
    const applyBtn = filterActions[0];
    expect(applyBtn.nativeElement.getAttribute('type')).toBe('button');

    applyBtn.nativeElement.click();
    fixture.detectChanges();

    const bodyText = fixture.nativeElement.textContent;
    expect(bodyText).toContain('7777');
    expect(bodyText).toContain('Integrated Row');
    expect(fixture.debugElement.queryAll(By.css('.mobile-card')).length).toBe(1);
  });
});

