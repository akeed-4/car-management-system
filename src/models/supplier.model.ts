export interface Supplier {
  id: number;
  name: string;
  crNumber: string; // Commercial Registration number
  taxNumber?: string; // VAT/Tax number
  phone: string;
  phone2?: string; // Secondary phone
  email?: string;
  website?: string;
  address: string;
  city?: string;
  district?: string;
  postalCode?: string;
  /** Requirement 7: National Address dictionary selections -- preferred over the free-text
   * city/district above. */
  countryId?: number | null;
  regionId?: number | null;
  cityId?: number | null;
  districtId?: number | null;
  buildingNumber?: string;
  streetName?: string;
  contactPerson?: string; // Primary contact person
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  paymentTerms?: string; // e.g., "Net 30", "Cash on Delivery"
  creditLimit?: number;
  bankName?: string;
  bankAccountNumber?: string;
  iban?: string;
  supplierCategory?: string; // e.g., "Parts", "Vehicles", "Services"
  notes?: string;
  isActive: boolean;
  createdDate: string;
  lastUpdated: string;
}