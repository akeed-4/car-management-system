/** One row per branch the caller may select as their active branch -- GET /api/platform/my/branches.
 *  See CarERP.Core/DTOs/System/BranchMembershipDto.cs. */
export interface BranchMembershipDto {
  branchId: number;
  nameAr: string;
  nameEn: string;
  status: string;
  companyId: number;
  isCurrent: boolean;
}

/** POST /api/platform/my/branches/{id}/select. No token/claim changes -- Branch is a
 *  client-persisted UI scope, not a JWT claim like Tenant. */
export interface SelectBranchResponseDto {
  branchId: number;
  nameAr: string;
  nameEn: string;
  companyId: number;
}
