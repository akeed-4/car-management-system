import { TenantStatus } from '../../../models/enums/platform.enums';

export function getTenantStatusClass(status: TenantStatus): string {
  switch (status) {
    case TenantStatus.Active: return 'status-chip-active';
    case TenantStatus.Provisioning: return 'status-chip-provisioning';
    case TenantStatus.Suspended: return 'status-chip-suspended';
    case TenantStatus.Blocked: return 'status-chip-blocked';
    default: return 'status-chip-default';
  }
}
