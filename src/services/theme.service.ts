import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'currentTheme';

/** Same shape as LanguageService (BehaviorSubject + localStorage persistence) -- LayoutComponent
 *  applies the theme to <html> the same way it already applies dir/lang via changeDirection(),
 *  rather than this service touching the DOM directly. */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<AppTheme>(this.getCurrentTheme());
  theme$ = this.themeSubject.asObservable();

  /** Null means "no explicit choice saved yet" -- the CSS's own
   *  prefers-color-scheme media query (styles.css) handles that case, so this only returns a
   *  concrete theme once a user has actually picked one. */
  getStoredTheme(): AppTheme | null {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  }

  /** Falls back to 'light' for callers (like the BehaviorSubject's initial value) that need a
   *  concrete theme rather than "no preference yet" -- the initial DOM attribute is set
   *  separately in LayoutComponent only when getStoredTheme() is non-null, so an unset
   *  preference still lets the CSS media query decide the very first render. */
  getCurrentTheme(): AppTheme {
    return this.getStoredTheme() ?? 'light';
  }

  setTheme(theme: AppTheme): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.themeSubject.next(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.themeSubject.value === 'dark' ? 'light' : 'dark');
  }
}
