export interface Branch {
  id: number;
  code?: string;
  name: { en: string; ar: string };
  description: string;
  status: 'active' | 'inactive';
  createdBy: string;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  tags: string[];
  geo: { lat: number; lng: number };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export interface Company {
  id: number;
  code?: string;
  name: { en: string; ar: string };
  description: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  tags: string[];
  geo: { lat: number; lng: number };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export interface Store {
  id: number;
  code?: string;
  name: { en: string; ar: string };
  description: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  tags: string[];
  geo: { lat: number; lng: number };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  companyId: number;
  branchId: number;
}