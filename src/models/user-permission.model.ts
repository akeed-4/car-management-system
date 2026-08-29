export interface UserEffectivePermission {
  key: string;
  title: string;
  group: string;
  granted: boolean;
  grantedByRoles: string[];
}
