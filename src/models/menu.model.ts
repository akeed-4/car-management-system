export interface MenuItem {
  id: number;
  name: string;
  englishName?: string;
  route?: string;
  icon?: string;
  parentId?: number;
  children?: MenuItem[];
  hasPermission?: boolean;
  isExpanded?: boolean;
  level?: number;
  order?: number;
  permissionKey?: string;
}

export interface MenuResponse {
  success: boolean;
  data: MenuItem[];
  message?: string;
}
