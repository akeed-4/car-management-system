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
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  occupation?: string;
  employer?: string;
  monthlyIncome?: number;
  creditScore?: number;
  preferredContactMethod?: 'Phone' | 'Email' | 'SMS';
  notes?: string;
  isActive: boolean;
  createdDate: string;
  lastUpdated: string;
}