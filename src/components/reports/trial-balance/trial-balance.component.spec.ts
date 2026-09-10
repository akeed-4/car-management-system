import { Component, Input, TemplateRef, ContentChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';

import { TrialBalanceComponent } from './trial-balance.component';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent } from '../shared/report-grid/report-grid.component';
import { AccountReportService } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';
import { TrialBalanceReport } from '@/src/models/reportmodel/trial-balance-report.model';

/** Fake trial-balance rows standing in for a real backend response -- enough to prove the
 *  component actually threads returned data into the grid rather than just not-crashing. */
const FAKE_ROWS: TrialBalanceReport[] = [
  {
    accountId: 1,
    accountCode: '1000',
    accountName: 'Cash',
    openingDebit: 1000,
    openingCredit: 0,
    periodDebit: 500,
    periodCredit: 200,
    closingDebit: 1300,
    closingCredit: 0,
  },
  {
    accountId: 2,
    accountCode: '2000',
    accountName: 'Accounts Payable',
    openingDebit: 0,
    openingCredit: 800,
    periodDebit: 100,
    periodCredit: 300,
    closingDebit: 0,
    closingCredit: 1000,
  },
];

/** Stand-ins for the real shared report components -- TrialBalanceComponent's own contract with
 *  them is just a handful of @Input()s/@Output()s, and the real ones pull in DevExtreme's
 *  dx-data-grid plus the whole accounts/stores/cost-centers service graph, none of which this
 *  spec needs: it's testing "does fake service data reach the grid's dataSource", not the grid
 *  or filter form themselves (those have their own specs). */
@Component({
  selector: 'app-report-container',
  standalone: true,
  template: `<ng-container [ngTemplateOutlet]="reportBody"></ng-container>`,
  imports: [NgTemplateOutlet],
})
class StubReportContainerComponent {
  @Input() title: any;
  @Input() subtitle: any;
  @Input() icon: any;
  @Input() showDateRange: any;
  @Input() showStoreFilter: any;
  @Input() showAccountFilter: any;
  @Input() loading: any;
  /** Mirrors the real container's projected-template contract (reportBody). */
  @ContentChild('reportBody') reportBody?: TemplateRef<unknown>;
}

@Component({
  selector: 'app-report-grid',
  standalone: true,
  template: ``,
})
class StubReportGridComponent {
  @Input() dataSource: any[] = [];
  @Input() columns: any;
  @Input() keyExpr: any;
  @Input() stateStorageKey: any;
  @Input() allowSorting: any;
  @Input() allowFiltering: any;
  @Input() allowGrouping: any;
  @Input() showSummary: any;
  @Input() height: any;
  @Input() noDataText: any;
}

describe('TrialBalanceComponent', () => {
  let component: TrialBalanceComponent;
  let fixture: ComponentFixture<TrialBalanceComponent>;
  let accountReportService: { getTrialBalance: jest.Mock };
  let notificationService: { showError: jest.Mock };

  beforeEach(async () => {
    accountReportService = { getTrialBalance: jest.fn() };
    notificationService = { showError: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [TrialBalanceComponent],
      providers: [
        { provide: AccountReportService, useValue: accountReportService },
        { provide: NotificationService, useValue: notificationService },
      ],
    })
      .overrideComponent(TrialBalanceComponent, {
        remove: { imports: [ReportContainerComponent, ReportGridComponent] },
        add: { imports: [StubReportContainerComponent, StubReportGridComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TrialBalanceComponent);
    component = fixture.componentInstance;
  });

  it('does not load any report data before Apply Filter is used', () => {
    fixture.detectChanges();

    expect(accountReportService.getTrialBalance).not.toHaveBeenCalled();
    expect(component.reportData).toEqual([]);
    expect(component.hasSearched).toBe(false);
  });

  it('renders the fake rows returned by the report service once a filter is applied', () => {
    accountReportService.getTrialBalance.mockReturnValue(of(FAKE_ROWS));
    fixture.detectChanges();

    component.onFilterChange({ startDate: '2026-01-01', endDate: '2026-01-31', storeId: 3 });
    fixture.detectChanges();

    expect(accountReportService.getTrialBalance).toHaveBeenCalledWith({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      storeId: 3,
    });
    expect(component.loading).toBe(false);
    expect(component.hasSearched).toBe(true);
    expect(component.reportData).toEqual(FAKE_ROWS);

    // The grid stub's dataSource is the real proof the fake data actually reached the view,
    // not just the component's own field.
    const gridStub: StubReportGridComponent = fixture.debugElement.query(
      By.directive(StubReportGridComponent),
    ).componentInstance;
    expect(gridStub.dataSource).toEqual(FAKE_ROWS);
  });

  it('sets loading true while the request is in flight, then false once data arrives', () => {
    const response$ = new Subject<TrialBalanceReport[]>();
    accountReportService.getTrialBalance.mockReturnValue(response$);
    fixture.detectChanges();

    component.onFilterChange({ startDate: '2026-01-01', endDate: '2026-01-31' });
    expect(component.loading).toBe(true);
    expect(component.reportData).toEqual([]);

    response$.next(FAKE_ROWS);
    response$.complete();

    expect(component.loading).toBe(false);
    expect(component.reportData).toEqual(FAKE_ROWS);
  });

  it('surfaces a translated error and clears loading when the report request fails', () => {
    accountReportService.getTrialBalance.mockReturnValue(throwError(() => new Error('network down')));
    fixture.detectChanges();

    component.onFilterChange({ startDate: '2026-01-01', endDate: '2026-01-31' });
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.reportData).toEqual([]);
    expect(notificationService.showError).toHaveBeenCalledWith('REPORTS.TRIAL_BALANCE.LOAD_ERROR');
  });
});
