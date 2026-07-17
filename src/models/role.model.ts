export interface Role {
  id: number;
  name: string;
  permissions: { [key: string]: boolean };
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleWithStats extends Role {
  usersCount: number;
  permissionsCount: number;
}
