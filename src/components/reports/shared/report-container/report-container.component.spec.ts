import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatNativeDateModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { ReportContainerComponent } from './report-container.component';

describe('ReportContainerComponent', () => {
  let component: ReportContainerComponent;
  let fixture: ComponentFixture<ReportContainerComponent>;
  let httpMock: HttpTestingController;

  /** StoreService and AccountingService each fire real HTTP requests from their own
   *  constructors (store list, account list, journal entries) -- flush whatever is
   *  outstanding so httpMock.verify() in afterEach has nothing left hanging, regardless of
   *  how many singleton services end up doing this. */
  function flushEagerRequests(): void {
    httpMock.match(() => true).forEach(req => req.flush([]));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportContainerComponent, MatNativeDateModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(ReportContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushEagerRequests();
  });

  afterEach(() => {
    flushEagerRequests();
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits filterChange with the current form value when Apply Filter is clicked', () => {
    const emitted: any[] = [];
    component.filterChange.subscribe(f => emitted.push(f));

    const applyButton = fixture.debugElement.query(
      By.css('.filter-actions button[color="primary"]'),
    );
    expect(applyButton).toBeTruthy(); // desktop Apply Filter button should be rendered

    applyButton.nativeElement.click();

    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(component.filterForm.value);
  });

  it('does not navigate the page when the filter <form> is submitted natively', () => {
    // Regression test: the Apply Filter/Reset buttons live inside <form [formGroup]>. A
    // <button> with no explicit type defaults to type="submit" inside a <form>, which fires
    // a native form submission (full page reload) alongside any (click) handler -- that
    // reload aborted the in-flight report request and left every report screen stuck on its
    // loading spinner with no completed request ever showing up in the network log.
    //
    // Dispatching a real 'submit' event (bypassing (click) entirely, the way pressing Enter
    // in a filter field would) is what actually exercises the browser's native-submission
    // path; asserting the event's defaultPrevented flag is the only reliable, jsdom-safe way
    // to prove the native reload was suppressed, since jsdom does not implement navigation.
    const emitted: any[] = [];
    component.filterChange.subscribe(f => emitted.push(f));

    const formEl: HTMLFormElement = fixture.debugElement.query(By.css('form.filter-form')).nativeElement;

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    formEl.dispatchEvent(submitEvent);
    fixture.detectChanges();

    // native form submission must be prevented
    expect(submitEvent.defaultPrevented).toBe(true);
    expect(emitted.length).toBe(1);
  });

  it('every button inside the filter <form> is type="button" (belt-and-suspenders against native submit)', () => {
    const buttonsInForm = fixture.debugElement.queryAll(By.css('form.filter-form button'));
    expect(buttonsInForm.length).toBeGreaterThan(0);
    for (const btn of buttonsInForm) {
      // button "<label>" must declare type="button"
      expect(btn.nativeElement.getAttribute('type')).toBe('button');
    }
  });

  it('does not emit filterChange when the form is invalid', () => {
    component.filterForm.get('storeId')!.setValidators(() => ({ required: true }));
    component.filterForm.get('storeId')!.updateValueAndValidity();

    const emitted: any[] = [];
    component.filterChange.subscribe(f => emitted.push(f));

    component.onApplyFilter();

    expect(emitted.length).toBe(0);
  });
});
