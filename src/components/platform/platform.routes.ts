import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';
import { platformAdminGuard } from '../../guards/platform-admin.guard';
import { permissionGuard } from '../../guards/permission.guard';

/**
 * Lazy-loaded Platform/SaaS admin area (Tenants, Subscription Plans, Subscriptions, Domains,
 * Global Settings). Uses loadComponent (true per-route lazy loading) rather than eager imports
 * into app.routes.ts, following the same pattern already used for car-reports.routes.ts --
 * app.routes.ts already has 200+ eager component imports and this area doesn't need to add to it.
 */
export const PLATFORM_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, platformAdminGuard()],
    children: [
      {
        path: 'dashboard',
        canActivate: [permissionGuard('platform.dashboard.view')],
        loadComponent: () => import('./dashboard/platform-dashboard.component').then(m => m.PlatformDashboardComponent),
      },
      {
        path: 'tenants',
        canActivate: [permissionGuard('platform.companies.view')],
        loadComponent: () => import('./tenants/tenant-list/tenant-list.component').then(m => m.TenantListComponent),
      },
      {
        path: 'tenants/new',
        canActivate: [permissionGuard('platform.companies.view')],
        loadComponent: () => import('./tenants/tenant-form/tenant-form.component').then(m => m.TenantFormComponent),
      },
      {
        path: 'tenants/edit/:id',
        canActivate: [permissionGuard('platform.companies.view')],
        loadComponent: () => import('./tenants/tenant-form/tenant-form.component').then(m => m.TenantFormComponent),
      },
      // "Companies" is the user-facing label/route for the same Tenant admin surface above
      // (menu.service.ts points here now) -- kept as separate paths onto the same components
      // rather than a rename, so /platform/tenants/* still resolves for anyone with it bookmarked.
      {
        path: 'companies',
        canActivate: [permissionGuard('platform.companies.view')],
        loadComponent: () => import('./tenants/tenant-list/tenant-list.component').then(m => m.TenantListComponent),
      },
      {
        path: 'companies/new',
        canActivate: [permissionGuard('platform.companies.view')],
        loadComponent: () => import('./tenants/tenant-form/tenant-form.component').then(m => m.TenantFormComponent),
      },
      {
        path: 'companies/edit/:id',
        canActivate: [permissionGuard('platform.companies.view')],
        loadComponent: () => import('./tenants/tenant-form/tenant-form.component').then(m => m.TenantFormComponent),
      },
      {
        path: 'plans',
        canActivate: [permissionGuard('platform.plans.view')],
        loadComponent: () => import('./plans/plan-list/plan-list.component').then(m => m.PlanListComponent),
      },
      {
        path: 'plans/new',
        canActivate: [permissionGuard('platform.plans.view')],
        loadComponent: () => import('./plans/plan-details/plan-details.component').then(m => m.PlanDetailsComponent),
      },
      {
        path: 'plans/:id',
        canActivate: [permissionGuard('platform.plans.view')],
        loadComponent: () => import('./plans/plan-details/plan-details.component').then(m => m.PlanDetailsComponent),
      },
      {
        path: 'subscriptions',
        canActivate: [permissionGuard('platform.subscriptions.view')],
        loadComponent: () => import('./subscriptions/subscription-list/subscription-list.component').then(m => m.SubscriptionListComponent),
      },
      {
        path: 'domains',
        canActivate: [permissionGuard('platform.domains.view')],
        loadComponent: () => import('./domains/domain-list/domain-list.component').then(m => m.DomainListComponent),
      },
      {
        path: 'settings',
        canActivate: [permissionGuard('platform.settings.view')],
        loadComponent: () => import('./settings/global-settings/global-settings.component').then(m => m.GlobalSettingsComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
