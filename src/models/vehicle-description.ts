/** Minimal shape needed to build a vehicle description -- any object carrying these raw
 * identification fields (Car, StoreCarStockDto, etc.) can be passed in without adapting it. */
export interface VehicleDescriptionParts {
  make?: string | null;
  model?: string | null;
  variant?: string | null;
  year?: number | null;
}

/**
 * Single reusable builder for "Toyota Camry 2024"-style vehicle descriptions, used everywhere a
 * vehicle-selection grid or form needs to show a human-readable label. Filters out any missing
 * part before joining, so it can never produce "undefined", "null", stray separators, or
 * double spaces -- callers with partial data (e.g. no Year yet) still get a valid, if shorter,
 * string instead of garbage text.
 */
export function buildVehicleDescription(vehicle: VehicleDescriptionParts | null | undefined): string {
  if (!vehicle) {
    return '';
  }
  return [vehicle.make, vehicle.model, vehicle.variant, vehicle.year]
    .filter((part): part is string | number => part !== null && part !== undefined && String(part).trim() !== '')
    .map(part => String(part).trim())
    .join(' ');
}
