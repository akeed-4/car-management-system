import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../environments/environment';
import { CurrentSettingService } from './current-setting.service';

// Removed duplicate MenuService class

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  constructor(
    private http: HttpClient,
    private currentSettingService: CurrentSettingService,
    @Inject(DOCUMENT) private document: Document
  ) { }

  getMenus(): Observable<any[]> {
    // Return the static menu data
    return of(menuData);
  }
}

export const menuData = [
  {
    id: 1,
    name: 'لوحة التحكم',
    englishName: 'Dashboard',
    route: '/dashboard',
  },
  {
    id: 1,
    name: 'البيانات الأساسية',
    englishName: 'Master Data',
    submenu: [
      { id: 12, name: 'الانشطة', englishName: 'Activities', route: '/setup/companies' },
      { id: 13, name: 'الفروع', englishName: 'Branches', route: '/setup/branches' },
      { id: 14, name: 'المعارض', englishName: 'Stores', route: '/setup/stores' }
    ]
  },

  {
    id: 2,
    name: 'التأسيس',
    englishName: 'Setup',
    submenu: [
      { id: 24, name: 'السيارات', englishName: 'Cars', route: '/setup/cars' },
      { id: 25, name: 'الشركات المصنعة', englishName: 'Manufacturers', route: '/setup/manufacturers' },
      { id: 26, name: 'موديلات السيارات', englishName: 'Car Models', route: '/setup/models' },
      { id: 28, name: 'فئات السيارات', englishName: 'Car Categories', route: '/setup/car-categories' },
      { id: 27, name: 'سنة الصنع', englishName: 'Manufacture Year', route: '/setup/year' },
      { id: 29, name: 'بطاقة السيارة', englishName: 'Car Card', route: '/setup/car-card' },
    ]
  },
  {
    id: 8,
    name: 'المعاملات المحاسبية',
    englishName: 'Accounts',
    submenu: [
      { id: 81, name: 'شجرة الحسابات', englishName: 'Chart of Accounts (Tree)', route: '/accounts/chart-of-accounts' },
      { id: 83, name: 'مراكز التكلفة', englishName: 'Cost Centers', route: '/cost-centers' },
      { id: 82, name: ' قيود اليومية', englishName: 'Journal Entries', route: '/accounts/journal-entries-list' },
      { id: 84, name: 'الأرصدة الافتتاحية المالية', englishName: 'Opening Balances Financial', route: '/accounts/opening-balances-financial' },
      { id: 85, name: 'سندات القبض', englishName: 'Receipt Vouchers', route: '/accounts/receipts' },
      { id: 86, name: 'سندات الصرف', englishName: 'Payment Vouchers', route: '/accounts/payments' },
      { id: 87, name: 'سندات العربون', englishName: 'Deposit Vouchers', route: '/accounts/deposits' },
      { id: 88, name: 'تمويل المخزون', englishName: 'Floor Plan Financing', route: '/accounts/floor-plan-financing' }
    ]
  },

  {
    id: 3,
    name: 'إدارة المخزون',
    englishName: 'Inventory Management',
    submenu: [
      { id: 31, name: 'الرصيد الافتتاحية للمخزون', englishName: 'Opening Balance Inventory', route: '/inventory/opening-balances' },
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
      { id: 43, name: 'الإدخالات اليومية', englishName: 'Daily Entries', route: '/daily-entries' },
      { id: 44, name: 'جدول التسليم', englishName: 'Delivery Schedule', route: '/deliveries' },
      {
        id: 45,
        name: 'تقارير إدارة السيارات',
        englishName: 'Car Management Reports',
        submenu: [
          { id: 4501, name: 'تقرير السيارات', englishName: 'Cars Report', route: '/car-management/reports/cars' },
          { id: 4502, name: 'تقرير المخزون الحالي', englishName: 'Current Car Inventory Report', route: '/car-management/reports/current-inventory' },
          { id: 4503, name: 'تقرير السيارات المتاحة', englishName: 'Available Cars Report', route: '/car-management/reports/available' },
          { id: 4504, name: 'تقرير السيارات المحجوزة', englishName: 'Reserved Cars Report', route: '/car-management/reports/reserved' },
          { id: 4505, name: 'تقرير السيارات المباعة', englishName: 'Sold Cars Report', route: '/car-management/reports/sold' },
          { id: 4506, name: 'تقرير السيارات المسلمة', englishName: 'Delivered Cars Report', route: '/car-management/reports/delivered' },
          { id: 4507, name: 'تقرير السيارات المطلوبة', englishName: 'Requested Cars Report', route: '/car-management/reports/requested' },
          { id: 4508, name: 'تقرير سيارات لدى الغير', englishName: 'Consignment Cars Report', route: '/car-management/reports/consignment' },
          { id: 4509, name: 'تقرير الإدخالات اليومية', englishName: 'Daily Entries Report', route: '/car-management/reports/daily-entries' },
          { id: 4510, name: 'تقرير جدول التسليم', englishName: 'Delivery Schedule Report', route: '/car-management/reports/delivery-schedule' },
          { id: 4511, name: 'تقرير حركة السيارات', englishName: 'Car Movement Report', route: '/car-management/reports/movement' },
          { id: 4512, name: 'تقرير حالة السيارات', englishName: 'Car Status Report', route: '/car-management/reports/status' },
          { id: 4513, name: 'تقرير السيارات حسب الفرع', englishName: 'Cars by Branch Report', route: '/car-management/reports/by-branch' },
          { id: 4514, name: 'تقرير السيارات حسب المخزن', englishName: 'Cars by Warehouse Report', route: '/car-management/reports/by-warehouse' },
          { id: 4515, name: 'تقرير السيارات حسب المورد', englishName: 'Cars by Supplier Report', route: '/car-management/reports/by-supplier' },
          { id: 4516, name: 'تقرير السيارات حسب الماركة', englishName: 'Cars by Brand Report', route: '/car-management/reports/by-brand' },
          { id: 4517, name: 'تقرير السيارات حسب الموديل', englishName: 'Cars by Model Report', route: '/car-management/reports/by-model' },
          { id: 4518, name: 'تقرير السيارات حسب سنة الصنع', englishName: 'Cars by Year Report', route: '/car-management/reports/by-year' },
          { id: 4519, name: 'تقرير السيارات حسب اللون', englishName: 'Cars by Color Report', route: '/car-management/reports/by-color' },
          { id: 4520, name: 'تقرير السيارات حسب رقم الهيكل', englishName: 'Cars by VIN Report', route: '/car-management/reports/by-vin' },
          { id: 4521, name: 'تقرير السيارات حسب رقم المحرك', englishName: 'Cars by Engine Number Report', route: '/car-management/reports/by-engine' },
          { id: 4522, name: 'تقرير تقادم المخزون', englishName: 'Inventory Aging Report', route: '/car-management/reports/inventory-aging' },
          { id: 4523, name: 'تقرير تقييم المخزون', englishName: 'Inventory Valuation Report', route: '/car-management/reports/inventory-valuation' },
          { id: 4524, name: 'تقرير تكلفة السيارة', englishName: 'Car Cost Report', route: '/car-management/reports/car-cost' },
          { id: 4525, name: 'تقرير ربحية السيارة', englishName: 'Car Profitability Report', route: '/car-management/reports/car-profitability' }
        ]
      }
    ]
  },
  {
    id: 9,
    name: 'الكيانات',
    englishName: 'Entities',
    submenu: [
      { id: 91, name: 'العملاء', englishName: 'Customers', route: '/entities/customers' },
      { id: 92, name: 'الموردين', englishName: 'Suppliers', route: '/entities/suppliers' },
      { id: 93, name: ' البنوك', englishName: 'Bank', route: '/entities/banks' }

    ]
  },
  {
    id: 6,
    name: 'المشتريات',
    englishName: 'Purchases',
    submenu: [
      { id: 603, name: 'طلبات الشراء', englishName: 'Purchase Requests', route: '/purchases/requisitions' },
      { id: 606, name: 'اعتماد طلبات الشراء', englishName: 'Purchase Request Approvals', route: '/purchases/requisition-approvals' },
      { id: 600, name: 'عروض أسعار الموردين', englishName: 'Supplier Quotations', route: '/purchases/requests' },
      { id: 602, name: 'اعتماد عروض أسعار الموردين', englishName: 'Supplier Quotation Approvals', route: '/purchases/offers' },
      { id: 604, name: 'أوامر الشراء', englishName: 'Purchase Orders', route: '/purchases/orders' },
      { id: 62, name: 'استلام المركبات', englishName: 'Vehicle Receiving', route: '/purchases/receipt-notes' },
      { id: 64, name: 'فواتير المشتريات النقدية', englishName: 'Cash Purchase Invoices', route: '/purchases/invoice/cash' },
      { id: 65, name: 'فواتير المشتريات الآجلة', englishName: 'Credit Purchase Invoices', route: '/purchases/invoice/credit' },
      { id: 66, name: 'مرتجعات المشتريات النقدية', englishName: 'Cash Purchase Returns', route: '/purchases/return/cash' },
      { id: 67, name: 'مرتجعات المشتريات الآجلة', englishName: 'Credit Purchase Returns', route: '/purchases/return/credit' }
    ]
  },
  {
    id: 5,
    name: 'المبيعات',
    englishName: 'Sales',
    submenu: [
      {
        id: 1004,
        name: 'البيع المباشر',
        englishName: 'Direct Sales',
        submenu: [
          { id: 10041, name: 'بيع نقدي', englishName: 'Cash Sale', route: '/sales/direct/cash-sale' },
          { id: 10042, name: 'بيع آجل', englishName: 'Credit Sale', route: '/sales/direct/credit-sale' },
          { id: 10043, name: 'بيع بالتقسيط', englishName: 'Installment Sale', route: '/sales/direct/installment-sale' },
          { id: 10044, name: 'إدارة الأقساط', englishName: 'Installment Management', route: '/installments' }
        ]
      },
      {
        id: 1006,
        name: 'مبيعات الشركات',
        englishName: 'Corporate Sales',
        submenu: [
          { id: 10061, name: 'عرض سعر', englishName: 'Customer Quotation', route: '/sales/corporate/quotations' },
          { id: 10062, name: 'أمر بيع', englishName: 'Sales Order', route: '/sales/corporate/orders' },
          { id: 10063, name: 'إذن تسليم', englishName: 'Delivery Note', route: '/sales/corporate/deliveries' },
          { id: 10064, name: 'فاتورة مبيعات', englishName: 'Sales Invoice', route: '/sales/corporate/invoices' },
          { id: 10065, name: 'سند قبض', englishName: 'Receipt Voucher', route: '/sales/corporate/receipts' }
        ]
      },
      {
        id: 1005,
        name: 'مبيعات التمويل البنكي',
        englishName: 'Bank Sales',
        submenu: [
          { id: 10051, name: 'عرض سعر', englishName: 'Customer Quotation', route: '/sales/bank/quotations' },
          { id: 10052, name: 'اعتماد البنك', englishName: 'Bank Approval', route: '/sales/bank/approvals' },
          { id: 10053, name: 'أمر بيع', englishName: 'Sales Order', route: '/sales/bank/orders' },
          { id: 10054, name: 'تسليم المركبة', englishName: 'Vehicle Delivery', route: '/sales/bank/deliveries' },
          { id: 10055, name: 'فاتورة مبيعات', englishName: 'Sales Invoice', route: '/sales/bank/invoices' },
          { id: 10056, name: 'تحصيلات البنك', englishName: 'Bank Collections', route: '/sales/bank/collections' }
        ]
      }
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
  },
  {
    id: 13,
    name: 'الموافقات',
    englishName: 'Approvals',
    submenu: [
      { id: 113, name: 'إدارة سير العمل', englishName: 'Workflow Management', route: '/approvals/workflows' },
      { id: 114, name: 'الموافقات المعلقة', englishName: 'Pending Approvals', route: '/approvals/pending' },
      { id: 115, name: 'لوحة الموافقات', englishName: 'Manager Approval Dashboard', route: '/approvals/manager' }
    ]
  },
  {
    id: 12,
    name: 'الاعدادات النظام',
    englishName: 'System Settings',
    submenu: [
      { id: 121, name: 'اعدادات حساب التكلفة', englishName: 'Cost Price Settings', route: '/setup/cost-price-settings' },
      { id: 122, name: 'اعدادات ترقيم المستندات', englishName: 'Document Numbering Settings', route: '/setup/document-numbering-settings' },
      { id: 123, name: 'اعدادات دورة حياة المستندات', englishName: 'Document Lifecycle Settings', route: '/setup/document-lifecycle-settings' },
      { id: 124, name: 'اعدادات رمز الاستجابة السريعة', englishName: 'QR Code Settings', route: '/setup/qr-code-settings' }
    ]
  },
  {
    id: 14,
    name: 'إدارة المنصة',
    englishName: 'Platform',
    submenu: [
      { id: 141, name: 'لوحة التحكم', englishName: 'Dashboard', route: '/platform/dashboard' },
      { id: 142, name: 'الشركات', englishName: 'Companies', route: '/platform/companies' },
      { id: 143, name: 'خطط الاشتراك', englishName: 'Subscription Plans', route: '/platform/plans' },
      { id: 144, name: 'الاشتراكات', englishName: 'Subscriptions', route: '/platform/subscriptions' },
      { id: 145, name: 'النطاقات', englishName: 'Domains', route: '/platform/domains' },
      { id: 146, name: 'الإعدادات العامة', englishName: 'Global Settings', route: '/platform/settings' }
    ]
  }
];