import { Injectable, Signal, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, shareReplay } from 'rxjs';

/**
 * Single shared source of truth for "is this a mobile viewport" across the
 * app. Unlike CurrentSettingService.usingSmallScreen() (a cold Observable —
 * every subscriber re-triggers its own BreakpointObserver.observe() call),
 * this multicasts one underlying subscription via shareReplay and exposes it
 * as a Signal, so any component can read isMobile() directly in a template
 * or computed() without an async pipe or its own subscription management.
 *
 * Mirrors styles-mobile.css's 768px tier (tablet+phone) rather than CDK's
 * Handset/XSmall (~599.98px), matching the mobile-first spec's breakpoint
 * range (320-768px) instead of Material's phone-only definition.
 */
@Injectable({ providedIn: 'root' })
export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);

  private readonly isMobile$ = this.breakpointObserver
    .observe(['(max-width: 768px)'])
    .pipe(
      map(result => result.matches),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  private readonly isHandset$ = this.breakpointObserver
    .observe([Breakpoints.Handset, Breakpoints.XSmall])
    .pipe(
      map(result => result.matches),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  /** True at <=768px (phones and small tablets) — use for markup-shape decisions (grid vs. card list). */
  readonly isMobile: Signal<boolean> = toSignal(this.isMobile$, { initialValue: false });

  /** True on CDK Handset/XSmall only (~599.98px and below) — use where a narrower phone-only cutoff is required. */
  readonly isHandset: Signal<boolean> = toSignal(this.isHandset$, { initialValue: false });
}
