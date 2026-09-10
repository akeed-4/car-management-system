import { Component, Input, Output, EventEmitter, OnInit, inject, DestroyRef, effect, ViewChild, ContentChild, ElementRef, TemplateRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ReportFilter } from '@/src/models/reportmodel';
import { AccountingService } from '../../../accounting/accounting.service';
import { StoreService } from '../../../../services/store.service';
import { CostCenterService } from '../../../../services/cost-center.service';
import { LanguageService } from '../../../../services/language.service';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileHeaderComponent } from '../../../shared/mobile-header/mobile-header.component';

@Component({
  selector: 'app-report-container',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule,
    MobileHeaderComponent
  ],
  templateUrl: './report-container.component.html',
  styleUrls: ['./report-container.component.css']
})
export class ReportContainerComponent implements OnInit {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = 'assessment';
  @Input() showDateRange: boolean = true;
  @Input() showAccountFilter: boolean = false;
  @Input() showStoreFilter: boolean = true;
  @Input() showCostCenterFilter: boolean = false;
  @Input() customFilters: any[] = [];
  @Input() loading: boolean = false;
  
  @Output() filterChange = new EventEmitter<ReportFilter>();
  @Output() exportPdf = new EventEmitter<void>();
  @Output() exportExcel = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  filterForm!: FormGroup;
  stores: { id: number; name: string }[] = [];
  accounts: { id: number; code: string; name: string }[] = [];
  costCenters: { id: number; name: string }[] = [];

  // ---- Mobile results/filters presentation ---------------------------------------------
  /** Mobile only: whether the collapsible filter card is expanded. Starts open so the user
   *  can immediately enter filters; onApplyFilter collapses it (mobile only) so the results
   *  card sits directly under the toggle instead of below the fold. */
  readonly filtersOpen = signal(true);
  /** Anchor for the scroll-to-results behavior on mobile (see onApplyFilter). */
  @ViewChild('resultsAnchor') private resultsAnchor?: ElementRef<HTMLElement>;

  /**
   * The report body (grid/tree) is passed as a projected <ng-template #reportBody> instead of
   * raw content: this template previously declared <ng-content> in BOTH @if (isMobile())
   * branches, and Angular only projects wildcard content into one of the two statically defined
   * slots -- the desktop one. That is why every accounting report rendered its chrome but NO
   * data/grid at all on mobile (the grid never mounted there), ever since the mobile branch was
   * added. An ng-template + [ngTemplateOutlet] in each branch renders the SAME projected
   * template whichever branch is active. (Same pattern as journal-entries.component.html's
   * journalEntryFormBody / shared-mobile-data-entry wiring.)
   */
  @ContentChild('reportBody') reportBody?: TemplateRef<unknown>;

  private accountingService = inject(AccountingService);
  private storeService = inject(StoreService);
  private costCenterService = inject(CostCenterService);
  private languageService = inject(LanguageService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;
  /** loadFilterData() runs from ngOnInit, not the constructor/a field initializer, so
   *  takeUntilDestroyed() there needs this passed explicitly -- it can't auto-detect an
   *  injection context from inside a lifecycle hook. */
  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder, private location: Location) {
    // StoreService.stores$ is a Signal (despite the Observable-style `$` name), not an
    // Observable -- effect() is the reactive read for a signal, and (like
    // takeUntilDestroyed()) needs an injection context, which a constructor is but ngOnInit
    // is not, hence this lives here instead of alongside the rest of loadFilterData().
    effect(() => {
      const arabic = this.languageService.getCurrentLanguage() !== 'en';
      this.stores = this.storeService.stores$().map(s => ({
        id: s.id,
        name: (arabic ? s.nameAr : s.nameEn) || s.nameEn || s.nameAr,
      }));
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadFilterData();
  }

  /**
   * Initialize filter form
   */
  private initializeForm(): void {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      accountId: [null],
      storeId: [null],
      costCenterId: [null]
    });

    // Add custom filters dynamically
    this.customFilters.forEach(filter => {
      this.filterForm.addControl(filter.name, this.fb.control(null));
    });

    // Filter changes intentionally do NOT auto-emit here -- only the explicit
    // "Apply Filter" button (onApplyFilter) and Reset (which clears the report,
    // it does not reload it) should trigger a report load.
  }

  /**
   * Load filter data (accounts, cost centers -- stores are handled by the effect() in the
   * constructor, since StoreService.stores$ is a Signal, not an Observable) from the real
   * app-wide services -- this was a hardcoded-empty stub, which meant the Store/Account/Cost
   * Center dropdowns above were always empty. That's the actual root cause of every accounting
   * report that requires an account selection (Account Balance, Account Statement) never being
   * able to load anything: the user could never pick an account, so onFilterChange's accountId
   * guard never let a request go out. Field names are mapped here because the underlying models
   * use different property names than this component's templates expect (Account uses
   * accountCode/accountNameAr/accountNameEn, not code/name).
   */
  private loadFilterData(): void {
    const arabic = this.languageService.getCurrentLanguage() !== 'en';

    this.accountingService.accounts$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accounts => {
      this.accounts = accounts
        .map(a => ({
          id: a.id,
          code: a.accountCode,
          name: (arabic ? a.accountNameAr : a.accountNameEn) || a.accountNameEn || a.accountNameAr,
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
    });

    this.costCenterService.costCenters$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(costCenters => {
      this.costCenters = costCenters.map(c => ({ id: c.id, name: (arabic ? c.nameAr : c.name) || c.name }));
    });
  }

  /**
   * Apply filters. Also bound to the filter <form>'s (ngSubmit) -- not just the button's
   * (click) -- so pressing Enter in a filter field, or any future button that loses its
   * type="button", still goes through Angular's event handling instead of falling back to
   * the browser's native form submission (a full page navigation that aborts the in-flight
   * report request and leaves the UI stuck on its loading state). preventDefault()/
   * stopPropagation() are applied unconditionally: (ngSubmit) already suppresses the native
   * submit by itself, but a plain (click) call from a stray submit button reaches here too,
   * so this must be safe to call with or without a real submit event.
   */
  onApplyFilter(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.filterForm.valid) {
      const filters: ReportFilter = this.filterForm.value;
      this.filterChange.emit(filters);
      // Mobile: collapse the filter card and bring the results card into view so the user
      // actually SEES the request start (spinner) and finish (rows) -- previously the results
      // rendered below the fold and tapping Apply looked like nothing happened.
      if (this.isMobile()) {
        this.filtersOpen.set(false);
        this.scrollToResults();
      }
    }
  }

  /**
   * Reset filters. Clears the form only -- does not re-run the report; the user
   * must click Apply Filter again, same as the initial empty state.
   */
  onResetFilter(): void {
    this.filterForm.reset();
  }

  /** Mobile header back button -- returns to wherever the report was opened from. */
  onBack(): void {
    this.location.back();
  }

  /** Number of non-empty filter fields, shown as a badge on the mobile filters toggle. */
  activeFilterCount(): number {
    const values = Object.values(this.filterForm?.value ?? {});
    return values.filter(v => v !== null && v !== undefined && v !== '').length;
  }

  /** Scrolls the results card into view (mobile). Runs in a setTimeout so the browser
   *  has laid out the card after the filters collapsed before measuring/scrolling. */
  private scrollToResults(): void {
    setTimeout(() => {
      this.resultsAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /**
   * Export to PDF
   */
  onExportPdf(): void {
    this.exportPdf.emit();
  }

  /**
   * Export to Excel
   */
  onExportExcel(): void {
    this.exportExcel.emit();
  }

  /**
   * Print report
   */
  onPrint(): void {
    this.print.emit();
  }

  /**
   * Refresh report data
   */
  onRefresh(): void {
    this.refresh.emit();
  }
}
