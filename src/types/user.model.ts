export interface User {
  id: number;
  name: string;
  password?: string; // Should not be sent to client, but needed for creation/update
  roleId: number;
  roleName: string;
  status: 'Active' | 'Inactive';
}
