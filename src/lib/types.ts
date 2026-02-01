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
}

export interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  guestName: string;
  hostName: string;
  propertyName: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  type?: 'payment' | 'refund';
  breakdown?: {
    accommodation: number;
    service_fee: number;
    taxes: number;
  };
  invoice_id?: string;
  booking_id?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'host' | 'admin';
  status: 'pending' | 'active' | 'rejected' | 'suspended' | 'approved_host';
  created_at: string;
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

export interface Property {
  id: string;
  name: string;
  location: string;
  tier: string;
  status: 'active' | 'pending' | 'rejected';
  host_id?: string;
  created_at?: string;
  images?: Array<{ url: string; alt: string }>;
  price_per_night?: number;
  amenities?: string[];
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
  title?: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  receiver_id: string;
  rating: number;
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
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending';
  guests: number;
  created_at: string;
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
