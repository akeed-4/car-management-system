export interface DomainDto {
  id: number;
  tenantId: number;
  tenantName: string;
  domainName: string;
  isVerified: boolean;
  hasSsl: boolean;
  verifiedAt?: string | null;
  createdAt: string;
}
