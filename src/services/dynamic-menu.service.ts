import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MenuItem, MenuResponse } from '../models/menu.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DynamicMenuService {
  private apiUrl = environment.origin || 'http://localhost:5000';
  
  // BehaviorSubject to store and emit menu data
  private menuSubject = new BehaviorSubject<MenuItem[]>([]);
  public menu$ = this.menuSubject.asObservable();
  
  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Error state
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Fetch menus from API with JWT token (automatically added by interceptor)
   */
  loadMenus(): Observable<MenuItem[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<MenuResponse>(`${this.apiUrl}api/menus`).pipe(
      map(response => {
        // Handle different response formats
        if (response.data) {
          return response.data;
        }
        // If response is directly an array
        return Array.isArray(response) ? response : [];
      }),
      map(menus => this.buildHierarchy(menus)),
      map(menus => this.filterByPermission(menus)),
      tap(menus => {
        this.menuSubject.next(menus);
        this.loadingSubject.next(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Build hierarchical menu structure from flat array
   */
  private buildHierarchy(items: MenuItem[]): MenuItem[] {
    const map = new Map<number, MenuItem>();
    const roots: MenuItem[] = [];

    // First pass: create map of all items
    items.forEach(item => {
      map.set(item.id, { ...item, children: [], level: 0 });
    });

    // Second pass: build hierarchy
    items.forEach(item => {
      const menuItem = map.get(item.id);
      if (menuItem) {
        if (item.parentId && map.has(item.parentId)) {
          const parent = map.get(item.parentId);
          if (parent) {
            menuItem.level = (parent.level || 0) + 1;
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(menuItem);
          }
        } else {
          roots.push(menuItem);
        }
      }
    });

    // Sort by order if available
    this.sortMenuItems(roots);
    
    return roots;
  }

  /**
   * Recursively sort menu items by order property
   */
  private sortMenuItems(items: MenuItem[]): void {
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        this.sortMenuItems(item.children);
      }
    });
  }

  /**
   * Filter menus based on permission
   * Remove menus where hasPermission is explicitly false
   */
  private filterByPermission(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      // If hasPermission is explicitly false, hide it
      if (item.hasPermission === false) {
        return false;
      }

      // Recursively filter children
      if (item.children && item.children.length > 0) {
        item.children = this.filterByPermission(item.children);
        
        // If parent has no route and all children are filtered out, hide parent
        if (!item.route && item.children.length === 0) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get current menu value synchronously
   */
  getCurrentMenus(): MenuItem[] {
    return this.menuSubject.value;
  }

  /**
   * Refresh menus from API
   */
  refreshMenus(): void {
    this.loadMenus().subscribe();
  }

  /**
   * Find menu item by route
   */
  findMenuByRoute(route: string): MenuItem | null {
    const menus = this.menuSubject.value;
    return this.searchMenuByRoute(menus, route);
  }

  private searchMenuByRoute(items: MenuItem[], route: string): MenuItem | null {
    for (const item of items) {
      if (item.route === route) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = this.searchMenuByRoute(item.children, route);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Toggle menu expansion state
   */
  toggleMenuExpansion(menuId: number): void {
    const menus = this.menuSubject.value;
    this.updateExpansionState(menus, menuId);
    this.menuSubject.next([...menus]);
  }

  private updateExpansionState(items: MenuItem[], menuId: number): boolean {
    for (const item of items) {
      if (item.id === menuId) {
        item.isExpanded = !item.isExpanded;
        return true;
      }
      if (item.children && item.children.length > 0) {
        if (this.updateExpansionState(item.children, menuId)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Error handling
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while loading menus';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('Menu loading error:', errorMessage);
    this.errorSubject.next(errorMessage);
    this.loadingSubject.next(false);
    
    // Return empty array on error to prevent breaking the UI
    this.menuSubject.next([]);
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Clear menu data
   */
  clearMenus(): void {
    this.menuSubject.next([]);
  }
}
