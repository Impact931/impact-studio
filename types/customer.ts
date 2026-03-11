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
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSession {
  customerId: string;
  email: string;
  name: string;
  company?: string;
  phone: string;
}
