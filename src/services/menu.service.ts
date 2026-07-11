import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../environments/environment.development';
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
    id: 2,
    name: 'التأسيس',
    englishName: 'Setup',
    submenu: [
      { id: 24, name: 'السيارات', englishName: 'Cars', route: '/setup/cars' },
      { id: 25, name: 'الشركات المصنعة', englishName: 'Manufacturers', route: '/setup/manufacturers' },
      { id: 26, name: 'موديلات السيارات', englishName: 'Car Models', route: '/setup/models' },
      { id: 28, name: 'فئات السيارات', englishName: 'Car Categories', route: '/setup/car-categories' },
      { id: 27, name: 'سنة الصنع', englishName: 'Manufacture Year', route: '/setup/year' },
      { id: 29, name: 'بطاقة السيارة', englishName: 'Car Card', route: '/setup/cars' },
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
      { id: 44, name: 'جدول التسليم', englishName: 'Delivery Schedule', route: '/deliveries' }
    ]
  },
  {
    id: 9,
    name: 'الكيانات',
    englishName: 'Entities',
    submenu: [
      { id: 91, name: 'العملاء', englishName: 'Customers', route: '/entities/customers' },
      { id: 92, name: 'الموردين', englishName: 'Suppliers', route: '/entities/suppliers' },
      { id: 93, name: ' البنوك', englishName: 'Bank', route: '/bank/list' }

    ]
  },
  {
    id: 6,
    name: 'المشتريات',
    englishName: 'Purchases',
    submenu: [
      { id: 603, name: 'طلبات الشراء', englishName: 'Purchase Requisitions', route: '/purchases/requisitions' },
      { id: 606, name: 'اعتماد طلبات الشراء', englishName: 'Purchase Requisition Approvals', route: '/purchases/requisition-approvals' },
      { id: 600, name: 'طلبات أسعار الموردين', englishName: 'Requests for Quotation (RFQ)', route: '/purchases/requests' },
      { id: 602, name: 'اعتماد عروض الأسعار', englishName: 'Supplier Quote Approval', route: '/purchases/offers' },
      { id: 604, name: 'أوامر الشراء', englishName: 'Purchase Orders', route: '/purchases/orders' },
      { id: 62, name: 'استلام السيارات (GRN)', englishName: 'Car Receipt Notes (GRN)', route: '/purchases/receipt-notes' },
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
          { id: 10041, name: 'بيع نقدي', englishName: 'Cash Sale', route: '/sales/direct/cash-sale/new' },
          { id: 10042, name: 'بيع آجل', englishName: 'Credit Sale', route: '/sales/direct/credit-sale/new' },
          { id: 10043, name: 'بيع بالتقسيط', englishName: 'Installment Sale', route: '/sales/direct/installment-sale/new' },
          { id: 10044, name: 'إدارة الأقساط', englishName: 'Installment Management', route: '/installments' }
        ]
      },
      {
        id: 1006,
        name: 'مبيعات الشركات',
        englishName: 'Corporate Sales',
        submenu: [
          { id: 10061, name: 'عرض سعر', englishName: 'Customer Quotation', route: '/sales/corporate/quotations/new' },
          { id: 10062, name: 'أمر بيع', englishName: 'Sales Order', route: '/sales/corporate/orders/new' },
          { id: 10063, name: 'إذن تسليم', englishName: 'Delivery Note', route: '/sales/corporate/deliveries/new' },
          { id: 10064, name: 'فاتورة مبيعات', englishName: 'Sales Invoice', route: '/sales/corporate/invoices/new' },
          { id: 10065, name: 'سند قبض', englishName: 'Receipt Voucher', route: '/sales/corporate/receipts/new' }
        ]
      },
      {
        id: 1005,
        name: 'مبيعات التمويل البنكي',
        englishName: 'Bank Sales',
        submenu: [
          { id: 10051, name: 'عرض سعر', englishName: 'Customer Quotation', route: '/sales/bank/quotations/new' },
          { id: 10052, name: 'اعتماد البنك', englishName: 'Bank Approval', route: '/sales/bank/approvals/new' },
          { id: 10053, name: 'أمر بيع', englishName: 'Sales Order', route: '/sales/bank/orders/new' },
          { id: 10054, name: 'تسليم المركبة', englishName: 'Vehicle Delivery', route: '/sales/bank/deliveries/new' },
          { id: 10055, name: 'فاتورة مبيعات', englishName: 'Sales Invoice', route: '/sales/bank/invoices/new' },
          { id: 10056, name: 'تحصيلات البنك', englishName: 'Bank Collections', route: '/sales/bank/collections/new' }
        ]
      }
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
      { id: 30, name: 'إعدادات حساب التكلفة', englishName: 'Cost Price Settings', route: '/setup/cost-price-settings' },

    ]
  }
];