import { Injectable, signal } from '@angular/core';
import { Role } from '../types/role.model';

export const PERMISSIONS_LIST = {
  dashboard: {
    title: 'لوحة التحكم',
    permissions: { view_dashboard: 'عرض لوحة التحكم' }
  },
  inventory: {
    title: 'المخزون',
    permissions: {
      view_inventory: 'عرض المخزون',
      add_car: 'إضافة سيارة',
      edit_car: 'تعديل سيارة',
      delete_car: 'حذف سيارة',
      manage_stock_take: 'إدارة جرد المخزون'
    }
  },
  sales: {
    title: 'المبيعات',
    permissions: {
      view_sales: 'عرض فواتير المبيعات',
      add_sales_invoice: 'إضافة فاتورة بيع',
      manage_sales_returns: 'إدارة مرتجعات المبيعات'
    }
  },
  procurement: {
    title: 'المشتريات',
    permissions: {
      view_procurement: 'عرض فواتير الشراء',
      add_purchase_invoice: 'إضافة فاتورة شراء',
      manage_purchase_returns: 'إدارة مرتجعات الشراء'
    }
  },
  entities: {
    title: 'الكيانات',
    permissions: {
      manage_customers: 'إدارة العملاء',
      manage_suppliers: 'إدارة الموردين'
    }
  },
  reports: {
    title: 'التقارير',
    permissions: {
      view_financial_reports: 'عرض التقارير المالية',
      view_tax_reports: 'عرض التقارير الضريبية',
      view_admin_reports: 'عرض التقارير الإدارية'
    }
  },
  setup: {
    title: 'التأسيس',
    permissions: { manage_setup: 'إدارة شاشات التأسيس' }
  },
  users: {
    title: 'المستخدمون',
    permissions: { manage_users: 'إدارة المستخدمين والصلاحيات' }
  }
};


@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private nextId = signal(4);
  private roles = signal<Role[]>([
    {
      id: 1,
      name: 'مدير النظام',
      permissions: Object.values(PERMISSIONS_LIST).reduce((acc, group) => {
        Object.keys(group.permissions).forEach(key => acc[key] = true);
        return acc;
      }, {} as { [key: string]: boolean })
    },
    {
      id: 2,
      name: 'مندوب مبيعات',
      permissions: {
        view_dashboard: true,
        view_inventory: true,
        view_sales: true,
        add_sales_invoice: true,
        manage_customers: true,
      }
    },
    { id: 3, name: 'محاسب', permissions: {
      view_financial_reports: true,
      view_tax_reports: true,
      view_sales: true,
      view_procurement: true,
    } },
  ]);

  public roles$ = this.roles.asReadonly();
  public permissionsList = PERMISSIONS_LIST;

  getRoleById(id: number): Role | undefined {
    return this.roles().find(r => r.id === id);
  }

  addRole(name: string): Role {
    const newRole: Role = {
      id: this.nextId(),
      name,
      permissions: {},
    };
    this.roles.update(roles => [...roles, newRole]);
    this.nextId.update(id => id + 1);
    return newRole;
  }

  updateRole(updatedRole: Role) {
    this.roles.update(roles =>
      roles.map(r => (r.id === updatedRole.id ? updatedRole : r))
    );
  }
  
  deleteRole(id: number) {
    // Should add logic to check if role is in use before deleting
    this.roles.update(roles => roles.filter(r => r.id !== id));
  }
}
