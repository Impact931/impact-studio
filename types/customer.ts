export interface Customer {
  customerId: string;
  email: string;
  name: string;
  company?: string;
  phone: string;
  hasInsurance: boolean;
  insuranceProvider?: string;
  coiFileKey?: string;
  stripeCustomerId?: string;
  // Profile
  bio?: string;
  profilePhotoKey?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  customerId: string;
  email: string;
  name: string;
  company?: string;
  phone: string;
  bio?: string;
  profilePhotoUrl?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
  hasInsurance: boolean;
  insuranceProvider?: string;
  createdAt: string;
}

export interface CustomerSession {
  customerId: string;
  email: string;
  name: string;
  company?: string;
  phone: string;
}
