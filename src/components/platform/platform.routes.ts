import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

/**
 * Lazy-loaded Platform/SaaS admin area (Tenants, Subscription Plans, Subscriptions, Domains,
 * Global Settings). Uses loadComponent (true per-route lazy loading) rather than eager imports
 * into app.routes.ts, following the same pattern already used for car-reports.routes.ts --
 * app.routes.ts already has 200+ eager component imports and this area doesn't need to add to it.
 */
export const PLATFORM_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/platform-dashboard.component').then(m => m.PlatformDashboardComponent),
      },
      {
        path: 'tenants',
        loadComponent: () => import('./tenants/tenant-list/tenant-list.component').then(m => m.TenantListComponent),
      },
      {
        path: 'tenants/new',
        loadComponent: () => import('./tenants/tenant-form/tenant-form.component').then(m => m.TenantFormComponent),
      },
      {
        path: 'tenants/edit/:id',
        loadComponent: () => import('./tenants/tenant-form/tenant-form.component').then(m => m.TenantFormComponent),
      },
      {
        path: 'plans',
        loadComponent: () => import('./plans/plan-list/plan-list.component').then(m => m.PlanListComponent),
      },
      {
        path: 'plans/new',
        loadComponent: () => import('./plans/plan-details/plan-details.component').then(m => m.PlanDetailsComponent),
      },
      {
        path: 'plans/:id',
        loadComponent: () => import('./plans/plan-details/plan-details.component').then(m => m.PlanDetailsComponent),
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./subscriptions/subscription-list/subscription-list.component').then(m => m.SubscriptionListComponent),
      },
      {
        path: 'domains',
        loadComponent: () => import('./domains/domain-list/domain-list.component').then(m => m.DomainListComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/global-settings/global-settings.component').then(m => m.GlobalSettingsComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
