export interface Role {
  id: number;
  name: string;
  permissions: { [key: string]: boolean };
  createdAt?: string;
  updatedAt?: string;
  /** The role a new tenant's first (self-registered) user is placed into. At most one role has
   *  this set; the backend refuses to delete it. */
  isDefaultAdmin?: boolean;
}

export interface RoleWithStats extends Role {
  usersCount: number;
  permissionsCount: number;
}
