export interface MyProfile {
  id: number;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  roleName: string;
  status: string;
  avatarUrl: string | null;
  tenantId: number | null;
  tenantName: string | null;
  createdAt: string;
}

export interface UpdateMyProfile {
  email?: string;
  phoneNumber?: string;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
}
