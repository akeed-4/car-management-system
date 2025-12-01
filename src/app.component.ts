
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion'; // <-- هذا مهم

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,MatListModule,MatSidenavModule,MatToolbarModule,MatIconModule, MatExpansionModule, // <-- استيراده هنا
  ],
})
export class AppComponent {
  private readonly sidebarDefaultOpen = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  isSidebarOpen = signal(this.sidebarDefaultOpen);
  openMenuIds = signal<Set<string>>(new Set());

 sidebarOpen = false;
openMenus: { [key: string]: boolean } = {};

toggleSidebar() {
  this.sidebarOpen = !this.sidebarOpen;
}

closeSidebar() {
  this.sidebarOpen = false;
}

toggleMenu(id: string) {
  this.openMenus[id] = !this.openMenus[id];
}

isMenuOpen(id: string) {
  return this.openMenus[id];
}



  menuData = [
  {
    id: 1,
    name: 'لوحة التحكم',
    route: '/dashboard',
    icon: 'home'
  },
  {
    id: 2,
    name: 'التأسيس',
    icon: 'settings',
    submenu: [
      { id: 21, name: 'الشركات المصنعة', route: '/setup/manufacturers' },
      { id: 22, name: 'موديلات السيارات', route: '/setup/models' },
      { id: 23, name: 'سنة الصنع', route: '/setup/year' },
      { id: 24, name: 'بطاقة السيارة', route: '/setup/card' }
    ]
  },
  {
    id: 3,
    name: 'إدارة المخزون',
    icon: 'inventory',
    submenu: [
      { id: 31, name: 'الرصيد الافتتاحي', route: '/inventory' },
      { id: 32, name: 'جرد بضاعة', route: '/inventory/stock-taking' },
      { id: 33, name: 'اعتماد جرد بضاعة', route: '/inventory/stock-taking-approval' }
    ]
  },
  {
    id: 4,
    name: 'إدارة السيارات',
    icon: 'directions_car',
    submenu: [
      { id: 41, name: 'السيارات المطلوبة', route: '/requested-cars' },
      { id: 42, name: 'سيارات لدى الغير', route: '/consignment-cars' },
      { id: 43, name: 'جدول التسليم', route: '/deliveries' }
    ]
  },
  {
    id: 5,
    name: 'المبيعات',
    icon: 'point_of_sale',
    submenu: [
      { id: 51, name: 'فواتير المبيعات', route: '/sales' },
      { id: 52, name: 'مرتجعات المبيعات', route: '/sales/returns' }
    ]
  },
  {
    id: 6,
    name: 'المشتريات',
    icon: 'shopping_cart',
    submenu: [
      { id: 61, name: 'فواتير المشتريات', route: '/purchases' },
      { id: 62, name: 'مرتجعات المشتريات', route: '/purchases/returns' }
    ]
  },
  {
    id: 7,
    name: 'العمليات',
    icon: 'build',
    submenu: [
      { id: 71, name: 'المصروفات', route: '/expenses' },
      { id: 72, name: 'إدارة الصيانة', route: '/maintenance' }
    ]
  },
  {
    id: 8,
    name: 'الحسابات',
    icon: 'account_balance',
    submenu: [
      { id: 81, name: 'سندات القبض', route: '/accounts/receipts' },
      { id: 82, name: 'سندات الصرف', route: '/accounts/payments' },
      { id: 83, name: 'سندات العربون', route: '/accounts/deposits' },
      { id: 84, name: 'تمويل المخزون', route: '/accounts/floor-plan-financing' }
    ]
  },
  {
    id: 9,
    name: 'الجهات',
    icon: 'groups',
    submenu: [
      { id: 91, name: 'العملاء', route: '/entities/customers' },
      { id: 92, name: 'الموردين', route: '/entities/suppliers' }
    ]
  },
  {
    id: 10,
    name: 'التقارير',
    icon: 'bar_chart',
    submenu: [
      { id: 101, name: 'التقارير المالية', route: '/reports/financial' },
      { id: 102, name: 'تقارير المخزون', route: '/reports/inventory' },
      { id: 103, name: 'تقارير المبيعات', route: '/reports/sales' }
    ]
  },
  {
    id: 11,
    name: 'المستخدمون والصلاحيات',
    icon: 'supervisor_account',
    submenu: [
      { id: 111, name: 'قائمة المستخدمين', route: '/users' },
      { id: 112, name: 'الأدوار والصلاحيات', route: '/users/roles' }
    ]
  }
];
}
