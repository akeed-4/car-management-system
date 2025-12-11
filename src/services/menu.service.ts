import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../environments/environment.development';
import { CurrentSettingService } from './current-setting.service';

// Removed duplicate MenuService class

export const menuData = [
  {
    id: 1,
    name: 'لوحة التحكم',
    englishName: 'Dashboard',
    route: '/dashboard',
  },
  {
    id: 2,
    name: 'التأسيس',
    englishName: 'Setup',
    submenu: [
      { id: 21, name: 'الشركات المصنعة', englishName: 'Manufacturers', route: '/setup/manufacturers' },
      { id: 22, name: 'موديلات السيارات', englishName: 'Car Models', route: '/setup/models' },
      { id: 23, name: 'سنة الصنع', englishName: 'Manufacture Year', route: '/setup/year' },
      { id: 24, name: 'بطاقة السيارة', englishName: 'Car Card', route: '/setup/card' }
    ]
  },
  {
    id: 3,
    name: 'إدارة المخزون',
    englishName: 'Inventory Management',
    submenu: [
      { id: 31, name: 'الرصيد الافتتاحي', englishName: 'Opening Balance', route: '/inventory' },
      { id: 32, name: 'جرد بضاعة', englishName: 'Stock Taking', route: '/inventory/stock-taking' },
      { id: 33, name: 'اعتماد جرد بضاعة', englishName: 'Stock Taking Approval', route: '/inventory/stock-taking-approval' }
    ]
  },
  {
    id: 4,
    name: 'إدارة السيارات',
    englishName: 'Car Management',
    submenu: [
      { id: 41, name: 'السيارات المطلوبة', englishName: 'Requested Cars', route: '/requested-cars' },
      { id: 42, name: 'سيارات لدى الغير', englishName: 'Consignment Cars', route: '/consignment-cars' },
      { id: 43, name: 'جدول التسليم', englishName: 'Delivery Schedule', route: '/deliveries' }
    ]
  },
  {
    id: 5,
    name: 'المبيعات',
    englishName: 'Sales',
    submenu: [
      { id: 51, name: 'فواتير المبيعات', englishName: 'Sales Invoices', route: '/sales' },
      { id: 52, name: 'مرتجعات المبيعات', englishName: 'Sales Returns', route: '/sales/returns' }
    ]
  },
  {
    id: 6,
    name: 'المشتريات',
    englishName: 'Purchases',
    submenu: [
      { id: 61, name: 'فواتير المشتريات', englishName: 'Purchase Invoices', route: '/purchases' },
      { id: 62, name: 'مرتجعات المشتريات', englishName: 'Purchase Returns', route: '/purchases/returns' }
    ]
  },
  {
    id: 7,
    name: 'العمليات',
    englishName: 'Operations',
    submenu: [
      { id: 71, name: 'المصروفات', englishName: 'Expenses', route: '/expenses' },
      { id: 72, name: 'إدارة الصيانة', englishName: 'Maintenance Management', route: '/maintenance' }
    ]
  },
  {
    id: 8,
    name: 'الحسابات',
    englishName: 'Accounts',
    submenu: [
      { id: 81, name: 'سندات القبض', englishName: 'Receipt Vouchers', route: '/accounts/receipts' },
      { id: 82, name: 'سندات الصرف', englishName: 'Payment Vouchers', route: '/accounts/payments' },
      { id: 83, name: 'سندات العربون', englishName: 'Deposit Vouchers', route: '/accounts/deposits' },
      { id: 84, name: 'تمويل المخزون', englishName: 'Floor Plan Financing', route: '/accounts/floor-plan-financing' }
    ]
  },
  {
    id: 9,
    name: 'الجهات',
    englishName: 'Entities',
    submenu: [
      { id: 91, name: 'العملاء', englishName: 'Customers', route: '/entities/customers' },
      { id: 92, name: 'الموردين', englishName: 'Suppliers', route: '/entities/suppliers' }
    ]
  },
  {
    id: 10,
    name: 'التقارير',
    englishName: 'Reports',
    submenu: [
      { id: 101, name: 'التقارير المالية', englishName: 'Financial Reports', route: '/reports/financial' },
      { id: 102, name: 'تقارير المخزون', englishName: 'Inventory Reports', route: '/reports/inventory' },
      { id: 103, name: 'تقارير المبيعات', englishName: 'Sales Reports', route: '/reports/sales' }
    ]
  },
  {
    id: 11,
    name: 'المستخدمون ',
    englishName: 'Users',
    submenu: [
      { id: 111, name: 'قائمة المستخدمين', englishName: 'User List', route: '/users' },
      { id: 112, name: 'الأدوار والصلاحيات', englishName: 'Roles & Permissions', route: '/users/roles' }
    ]
  }
];
// const menus: menuDto[] = [
//   {
//   menuId: 1,
//   menuNameAr: 'تكويدات',
//   menuNameEn: 'Coding',
//   menuUrl : ' ',
//   items: [
//     {
//     menuId: 2,
//     menuNameAr: 'بيانات أساسية',
//     menuNameEn: 'Basic Data',
//     menuUrl : ' ',
//     items :[
//     {
//       menuId  : 3,
//       menuNameAr : "الدول",
//       menuNameEn : "Countries",
//       menuUrl : '/country'
//     },{
//       menuId  : 4,
//       menuNameAr : "المناطق الإدارية",
//       menuNameEn : "States",
//       menuUrl : '/state'
//     },{
//       menuId  : 5,
//       menuNameAr : "المدن",
//       menuNameEn : "Cities",
//       menuUrl : '/city'
//     },{
//       menuId  : 6,
//       menuNameAr : "الأحياء",
//       menuNameEn : "Districts",
//       menuUrl : '/district'
//     }
//   ]
//   },
//   {
//     menuId: 3,
//     menuNameAr: 'الأصناف',
//     menuNameEn: 'Items',
//     menuUrl : ' '
//   }],
// },
// {
//   menuId: 2,
//   menuNameAr: 'المخازن',
//   menuNameEn: 'Inventory',
//   menuUrl : ' ',
// },
// {
//   menuId: 2,
//   menuNameAr: 'الإعدادات',
//   menuNameEn: 'Settings',
//   menuUrl : ' ',
//   items :[
//   {
//     menuId  : 3,
//     menuNameAr : "استيراد البيانات الأساسية",
//     menuNameEn : "Import Basic Data",
//     menuUrl : '/task/importfiles'
//   }
// ]
// }
// ];

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  getMenus(): Observable<any[]> {
    return of(menuData);
  }
}
   
// const menus: menuDto[] = [{
//   baseId: 1,
//   menuName: 'تكويدات',
//   applicationId : 6,
//   show : true,
//   isMain : true,
//   mainMenu : null,
//   menuUrl : '  ',
//   items: [{
//   menuId: 2,
//   menuName: 'الفروع',
//   applicationId : 6,