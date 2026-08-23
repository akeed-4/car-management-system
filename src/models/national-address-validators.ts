import { Validators } from '@angular/forms';

/**
 * Requirement 7: shared numeric-only validators for National Address fields (Postal Code,
 * Building Number) so the pattern/length rule lives in one place instead of being retyped in
 * every form that collects a National Address (Customer, Supplier, ...).
 */
export const POSTAL_CODE_LENGTH = 5;
export const BUILDING_NUMBER_LENGTH = 4;

export const postalCodeValidators = [Validators.pattern(new RegExp(`^\\d{${POSTAL_CODE_LENGTH}}$`))];
export const buildingNumberValidators = [Validators.pattern(new RegExp(`^\\d{${BUILDING_NUMBER_LENGTH}}$`))];
