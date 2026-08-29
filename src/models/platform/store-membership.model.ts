/** One row per store (Showroom) the caller may select as their active store -- GET
 *  /api/platform/my/stores. See CarERP.Core/DTOs/System/StoreMembershipDto.cs. Store
 *  authorization is independent of Branch (backed by UserStoreAssignment, not derived from
 *  UserBranch). */
export interface StoreMembershipDto {
  storeId: number;
  nameAr: string;
  nameEn: string;
  status: string;
  companyId: number;
  branchId: number;
  isCurrent: boolean;
}

/** POST /api/platform/my/stores/{id}/select. No token/claim changes -- Store is a
 *  client-persisted UI scope, not a JWT claim like Tenant. */
export interface SelectStoreResponseDto {
  storeId: number;
  nameAr: string;
  nameEn: string;
  companyId: number;
  branchId: number;
}
