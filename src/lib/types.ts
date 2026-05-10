import { GuestStatus } from '@/app/host-dashboard/types';

export interface SVGProps {
  className?: string;
  [key: string]: unknown;
}

export interface Stat {
  title: string;
  value: string;
  icon: string;
  trend: { value: string; isPositive: boolean };
  bgColor: string;
  onClick?: () => void;
}

export interface VerificationItem {
  id: string;
  name: string;
  type: 'host' | 'guest';
  submittedDate: string;
  documentType: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  profileImage: string;
  profileImageAlt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Dispute {
  id: string;
  caseNumber: string;
  guestName: string;
  hostName: string;
  propertyName: string;
  issueType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdDate: string;
  lastUpdate: string;
  booking_id?: string;
  guest_id?: string;
  host_id?: string;
  property_id?: string;
  description?: string;
  host_response?: string;
  amount?: number;
}

export interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  guestName: string;
  hostName: string;
  propertyName: string;
  amount: number;
  serviceFee?: number;
  netRevenue?: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  type?: 'payment' | 'refund';
  breakdown?: {
    accommodation: number;
    service_fee: number;
    taxes: number;
  };
  invoice_id?: string;
  booking_id?: string;
  guestAddress?: string;
  bookingDate?: string;
  cancellationDate?: string;
  refundDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'host' | 'admin';
  status: 'pending' | 'active' | 'rejected' | 'suspended' | 'approved_host';
  created_at: string;
  rejection_reason?: string;
  avatar_url?: string;
  totalBookings?: number;
  reward_points?: number;
}

export interface UserVerificationStatus {
  user_id: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdVerified: boolean;
  isPaymentMethodVerified: boolean;
}

export interface RecentActivity {
  id: string;
  type: 'verification' | 'booking' | 'dispute' | 'payout';
  title: string;
  description: string;
  timestamp: string;
  status: 'info' | 'success' | 'error' | 'warning';
}

export interface Amenity {
  id: string;
  name: string;
  available?: boolean;
  description?: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  tier: string;
  status: 'active' | 'pending' | 'rejected' | 'offline';
  host_id?: string;
  created_at?: string;
  images?: Array<{ url: string; alt: string }>;
  price_per_night?: number;
  amenities?: (string | Amenity)[];
  rules?: string[];
  rating?: number;
  reviews_count?: number;
  host?: {
    name: string;
    verified: boolean;
    avatar: string;
    avatarAlt: string;
    joinedDate: string;
    responseRate: number;
    responseTime: string;
  };
  instantBook?: boolean;
  capacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  updated_at?: string;
  cancellationPolicy?: string;
  description?: string;
  isActive?: any;
  type?: string;
  price?: number;
  weekendPrice?: number;
  documents?: any;
  weekend_price_per_night?: number;
  license_url?: string;
  tax_bill_url?: string;
  current_bill_url?: string;
  // Tent-specific identity documents
  aadhar_url?: string;
  pan_url?: string;
  noc_url?: string;
  safety_items?: string[];
  title?: string;
  image_url?: string;
  cancellation_policy?: string;
  area?: number;
  co_host_name?: string;
  co_host_email?: string;
  address_line1?: string;
  address_line2?: string;
  landmark?: string;
  district?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  show_specific_location?: boolean;
  beds?: number;
  total_rooms?: number;
  room_type?: string;
  check_in_time?: string;
  check_out_time?: string;
  latitude?: number;
  longitude?: number;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  receiver_id: string;
  rating: number; // Overall rating
  cleanliness_rating?: number;
  accuracy_rating?: number;
  check_in_rating?: number;
  communication_rating?: number;
  location_rating?: number;
  value_rating?: number;
  comment: string;
  created_at: string;
  guestName?: string;
}

export interface PersonalInfo {
  user_id: string;
  bio: string;
  languages: string[];
  location: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  occupation: string;
}

export interface Preferences {
  user_id: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  instantBook: boolean;
  currency: string;
  language: string;
  timezone: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: 'Milestone' | 'Loyalty' | 'Activity';
  title: string;
  description: string;
  dateAwarded: string;
  icon: string;
}

export interface Booking {
  id: string;
  guest_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending' | 'pending_payment' | 'refunded';
  guests: number;
  created_at: string;
  cancelled_at?: string;
  has_free_cancellation?: boolean;
  free_cancellation_fee?: number;
  guest?: {
    name: string;
    avatar_url: string;
  };
  properties?: Property;
}

export interface Earning {
  month: string;
  earnings: number;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  property_id: string;
  board: string;
  notes: string;
  property: {
    id: string;
    title: string;
    images: string[];
    location: string;
    price_per_night: number;
  };
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social_media' | 'promo_code';
  status: 'active' | 'completed' | 'scheduled' | 'paused' | 'draft';
  start_date?: string;
  end_date?: string;
  budget?: number;
  spend?: number;
  conversions?: number;
  impressions?: number;
  clicks?: number;
  cpa?: number;
  created_at?: string;
}

export interface PropertyOccupancy {
  id: string;
  propertyName: string;
  guestName: string;
  status: GuestStatus;
  checkInDate: string;
  checkOutDate: string;
  avatarUrl?: string; // Optional: Guest photo chupinchalante
  roomNumber?: string; // Optional: For hotel-style management
}

export type { GuestStatus };

export interface PriceSuggestion {
  propertyId: string;
  propertyName: string;
  suggestion: string;
  impact: string;
}

export interface RevenueForecastData {
  date: string;
  expectedEarnings: number;
}

export interface PropertyControlData {
  id: string;
  propertyName: string;
  isBlocked: boolean;
}
export interface PropertyQualityScore {
  propertyId: string;
  propertyName: string;
  score: number;
  feedback: string[];
}
