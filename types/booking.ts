export interface EquipmentItem {
  id: string;
  name: string;
  category: 'studio' | 'bundle' | 'alacarte' | 'addon';
  priceInStudio: number; // cents
  priceOutOfStudio: number; // cents
  description?: string;
  included?: boolean; // e.g. light stands included in-studio
}

export interface BookingFormData {
  // Renter
  renterName: string;
  company: string;
  phone: string;
  email: string;

  // Production
  productionType: string;
  description: string;
  estimatedPeople: string;
  backgroundUsage: boolean;
  backgroundColor: string;
  specialRequirements: string[];
  contentDisclosure: string[];

  // Rental
  rentalDate: string;
  startTime: string;
  endTime: string;
  studioRentalType: 'hourly' | 'half_day' | 'full_day';
  equipment: CartItem[];
  rentalMode: 'in_studio' | 'out_of_studio';
  damageWaiver: boolean;
  offSiteEquipment: boolean;

  // Insurance
  hasInsurance: boolean;
  insuranceProvider: string;

  // Signature
  signedName: string;
  signatureDataUrl: string; // base64 PNG
  agreedToTerms: boolean;
}

export interface CartItem {
  equipmentId: string;
  name: string;
  price: number; // cents
  quantity: number;
}

export interface Booking extends BookingFormData {
  bookingId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  signatureImageKey?: string;
  coiFileKey?: string;
  securityHold: boolean;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}
