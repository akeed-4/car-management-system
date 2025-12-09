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
    route: '/dashboard',
  },
  {
    id: 2,
    name: 'التأسيس',
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
    submenu: [
      { id: 31, name: 'الرصيد الافتتاحي', route: '/inventory' },
      { id: 32, name: 'جرد بضاعة', route: '/inventory/stock-taking' },
      { id: 33, name: 'اعتماد جرد بضاعة', route: '/inventory/stock-taking-approval' }
    ]
  },
  {
    id: 4,
    name: 'إدارة السيارات',
    submenu: [
      { id: 41, name: 'السيارات المطلوبة', route: '/requested-cars' },
      { id: 42, name: 'سيارات لدى الغير', route: '/consignment-cars' },
      { id: 43, name: 'جدول التسليم', route: '/deliveries' }
    ]
  },
  {
    id: 5,
    name: 'المبيعات',
    submenu: [
      { id: 51, name: 'فواتير المبيعات', route: '/sales' },
      { id: 52, name: 'مرتجعات المبيعات', route: '/sales/returns' }
    ]
  },
  {
    id: 6,
    name: 'المشتريات',
    submenu: [
      { id: 61, name: 'فواتير المشتريات', route: '/purchases' },
      { id: 62, name: 'مرتجعات المشتريات', route: '/purchases/returns' }
    ]
  },
  {
    id: 7,
    name: 'العمليات',
    submenu: [
      { id: 71, name: 'المصروفات', route: '/expenses' },
      { id: 72, name: 'إدارة الصيانة', route: '/maintenance' }
    ]
  },
  {
    id: 8,
    name: 'الحسابات',
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
    submenu: [
      { id: 91, name: 'العملاء', route: '/entities/customers' },
      { id: 92, name: 'الموردين', route: '/entities/suppliers' }
    ]
  },
  {
    id: 10,
    name: 'التقارير',
    submenu: [
      { id: 101, name: 'التقارير المالية', route: '/reports/financial' },
      { id: 102, name: 'تقارير المخزون', route: '/reports/inventory' },
      { id: 103, name: 'تقارير المبيعات', route: '/reports/sales' }
    ]
  },
  {
    id: 11,
    name: 'المستخدمون ',
    submenu: [
      { id: 111, name: 'قائمة المستخدمين', route: '/users' },
      { id: 112, name: 'الأدوار والصلاحيات', route: '/users/roles' }
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