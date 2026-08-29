export interface UserRoleSummary {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  password?: string; // Should not be sent to client, but needed for creation/update
  /** First/primary role -- kept for the existing Users grid/filters, which show one role per row.
   *  See `roles` for the full set (a user may now hold more than one). */
  roleId: number;
  roleName: string;
  /** Every role currently assigned to this user. Only populated by endpoints that resolve the
   *  full set (GET /api/Users/{id}/roles via UserService.getUserRoles) -- the list/get-by-id
   *  endpoints backing `roleId`/`roleName` above only ever return the first role here. */
  roles?: UserRoleSummary[];
  status: 'Active' | 'Inactive';
  isLocked: boolean;
  lockoutEnd: string | null;
}
