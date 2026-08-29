import { StoreMembershipDto } from './platform/store-membership.model';

/**
 * Resolves a human-readable name for a document's storeId, now that operational screens no
 * longer offer a Store dropdown (see StoreContextService) -- used to render a small read-only
 * "Store: X" label in place of the removed picker. Looks the id up in the caller's full list of
 * authorized stores first (so an edit-mode document from a non-current store still shows a real
 * name), falling back to the current store's own name for the common case of a brand-new
 * document (storeId === current store, which may not yet be present in `stores` on a cold load).
 */
export function resolveStoreDisplayName(
  stores: StoreMembershipDto[],
  storeId: number | null | undefined,
  currentStoreName: string | null | undefined,
): string {
  if (storeId == null) return currentStoreName ?? '';
  const match = stores.find(s => s.storeId === storeId);
  return (match?.nameAr || match?.nameEn) ?? currentStoreName ?? '';
}
