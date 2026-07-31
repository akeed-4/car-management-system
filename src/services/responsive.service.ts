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
 * 840px (not 768px): the shell's compact layout (off-canvas nav drawer,
 * header overflow menu, dashboard single-column grids) needs to cover
 * modern iPads in portrait (mini 768, base ~810, Air 820, Pro 11" 834) too,
 * not just phones — keep in sync with the same literal duplicated across
 * shell.component.css, shell-nav-rail.component.css, shell-header.component.css,
 * and the dashboard widget CSS files.
 */
@Injectable({ providedIn: 'root' })
export class ResponsiveService {
  private breakpointObserver = inject(BreakpointObserver);

  private readonly isMobile$ = this.breakpointObserver
    .observe(['(max-width: 840px)'])
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

  /** True at <=840px (phones and tablets in portrait) — use for markup-shape decisions (grid vs. card list). */
  readonly isMobile: Signal<boolean> = toSignal(this.isMobile$, { initialValue: false });

  /** True on CDK Handset/XSmall only (~599.98px and below) — use where a narrower phone-only cutoff is required. */
  readonly isHandset: Signal<boolean> = toSignal(this.isHandset$, { initialValue: false });
}
