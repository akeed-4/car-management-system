export interface Customer {
  id: number;
  name: string;
  nationalId: string; // or Iqama ID
  phone: string;
  phone2?: string; // Secondary phone
  email?: string;
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
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  occupation?: string;
  employer?: string;
  monthlyIncome?: number;
  creditScore?: number;
  creditLimit: number;
  preferredContactMethod?: 'Phone' | 'Email' | 'SMS';
  notes?: string;
  isActive: boolean;
  isCreditCustomer: boolean;
  createdDate: string;
  lastUpdated: string;
}