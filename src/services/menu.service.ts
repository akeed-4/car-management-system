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
      { id: 600, name: 'طلبات أسعار الموردين', englishName: 'Requests for Quotation (RFQ)', route: '/purchases/requests' },
      { id: 602, name: 'اعتماد عروض الأسعار', englishName: 'Supplier Quote Approval', route: '/purchases/offers' },
      { id: 61, name: 'عروض المشتريات', englishName: 'Purchase Offers', route: '/purchases/offers' },
      { id: 604, name: 'أوامر الشراء', englishName: 'Purchase Orders', route: '/purchases/orders' },
      { id: 62, name: 'استلام السيارات', englishName: 'Car Receipts', route: '/purchases/receipts' },
      { id: 64, name: 'فواتير المشتريات النقدية', englishName: 'Cash Purchase Invoices', route: '/purchases/invoice/cash' },
      { id: 65, name: 'فواتير المشتريات الاجلة', englishName: 'Credit Purchase Invoices', route: '/purchases/invoice/credit' },
      { id: 66, name: 'مرتجعات المشتريات النقدية', englishName: 'Cash Purchase Returns', route: '/purchases/return/cash' },
      { id: 67, name: 'مرتجعات المشتريات الاجلة', englishName: 'Credit Purchase Returns', route: '/purchases/return/credit' }
    ]
  },
  {
    id: 5,
    name: 'المبيعات',
    englishName: 'Sales',
    submenu: [
      {
        id: 1001,
        name: 'البيع المباشر',
        englishName: 'Direct Invoice',
        submenu: [
          { id: 10011, name: 'فواتير المبيعات النقدية', englishName: 'Direct Sales Invoices', route: 'sales/invoice/cash/new' },
          { id: 10012, name: 'مرتجعات المبيعات الاجلة', englishName: 'Direct Sales Returns', route: 'sales/return/credit/new' },
          { id: 10013, name: 'اعتماد مرتجعات المبيعات النقدية', englishName: 'Approve Direct Sales Returns', route: 'sales/invoice/cash/return/new' },
          { id: 10014, name: 'اعتماد مرتجعات المبيعات الاجلة', englishName: 'Approve Direct Sales Returns', route: 'sales/invoice/credit/return/new' }
        ],
      },
  
      {
        id: 1003,
        name: 'الشركات',
        englishName: 'Companies',
        submenu: [
          { id: 10031, name: 'عروض الأسعار', englishName: 'Quotations', route: '/sales/quotations' },
          { id: 10032, name: 'أوامر الشراء', englishName: 'Purchase Orders', route: '/sales/companies/purchase-orders' },
          { id: 10033, name: 'الفوترة الآجلة', englishName: 'Credit Invoicing', route: '/sales/companies/companies-invoice' }
        ]
      },
      {
        id: 1004,
        name: 'البيع المباشر للأفراد',
        englishName: 'Direct Retail Sales',
        submenu: [
          { id: 10041, name: 'عرض سعر التجزئة', englishName: 'Retail Quotation', route: '/sales/retail/quotations/new' },
          { id: 10042, name: 'فاتورة ودفع التجزئة', englishName: 'Retail Invoice & Payment', route: '/sales/retail/invoices/new' },
          { id: 10043, name: 'إذن تسليم التجزئة', englishName: 'Retail Delivery Note', route: '/sales/retail/deliveries/new' }
        ]
      },
      {
        id: 1005,
        name: 'مبيعات التمويل البنكي',
        englishName: 'Bank Financing Sales',
        submenu: [
          { id: 10051, name: 'عرض السعر وحجز الشاصي', englishName: 'Finance Quotation & VIN Lock', route: '/sales/bank-financing/quotations/new' },
          { id: 10052, name: 'اعتماد أمر الشراء البنكي', englishName: 'Bank LPO & Approval', route: '/sales/bank-financing/approvals/new' },
          { id: 10053, name: 'الفاتورة المقسمة والتسليم', englishName: 'Split Invoice & Handover', route: '/sales/bank-financing/invoices/new' }
        ]
      },
      {
        id: 1006,
        name: 'مبيعات الأسطول للشركات',
        englishName: 'B2B Corporate Fleet Sales',
        submenu: [
          { id: 10061, name: 'عرض سعر الأسطول', englishName: 'Fleet Quotation', route: '/sales/corporate/quotations/new' },
          { id: 10062, name: 'اعتماد الائتمان وأمر الشراء', englishName: 'Credit & PO Verification', route: '/sales/corporate/orders/new' },
          { id: 10063, name: 'الفوترة والتسليم الدفعي', englishName: 'Invoicing & Multi-Delivery', route: '/sales/corporate/dispatch' }
        ]
      },
      { id: 51, name: 'عروض العملاء', englishName: 'Customer Quotations', route: '/sales/quotations' },
      { id: 52, name: 'فواتير المبيعات النقدية', englishName: 'Cash Sales Invoices', route: '/sales/invoice/cash' },
      { id: 53, name: 'فواتير المبيعات الاجلة', englishName: 'Credit Sales Invoices', route: '/sales/invoice/credit' },
      { id: 54, name: 'إدارة الأقساط', englishName: 'Installment Management', route: '/installments' },
      { id: 55, name: 'مرتجعات المبيعات النقدية', englishName: 'Cash Sales Returns', route: '/sales/return/cash' },
      { id: 56, name: 'مرتجعات المبيعات الاجلة', englishName: 'Credit Sales Returns', route: '/sales/return/credit' },
      { id: 57, name: 'اعتماد مرتجعات المبيعات', englishName: 'Approve Sales Returns', route: '/sales/returns-approval' }
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