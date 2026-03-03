export interface Earning {
  month: string;
  earnings: number;
}

export type GuestStatus = 'In-house' | 'Departure' | 'Arrival' | 'Checked-in' | 'Arriving Soon';

export interface PropertyOccupancy {
  id: string;
  propertyName: string;
  guestName: string;
  status: GuestStatus;
  checkInDate: string;
  checkOutDate: string;
}

export interface PropertyOccupancyData {
  inHouse: PropertyOccupancy[];
  departures: PropertyOccupancy[];
  arrivals: PropertyOccupancy[];
}

export interface PriceSuggestion {
  propertyId: string;
  propertyName: string;
  suggestion: string; // e.g., "Increase price by 15% for next week"
  impact: string; // e.g., "High demand"
}

export interface PropertyControlData {
  id: string;
  propertyName: string;
  isBlocked: boolean; // For "Instant Block" toggle
}

export interface PropertyQualityScore {
  propertyId: string;
  propertyName: string;
  score: number; // 1-10 level score
  feedback: string[]; // e.g., "Add more kitchen photos", "Improve description"
}

export type PayoutStatus = 'Initiated' | 'Completed' | 'Failed';

export interface PayoutData {
  id: string;
  date: string;
  platformFee: number;
  netProfit: number;
  totalPayout: number;
  status: PayoutStatus;
}

export type SentimentLabel = 'Urgent' | 'Happy' | 'Frustrated' | 'Neutral';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  content: string;
  sentiment: SentimentLabel;
  is_read: boolean;
  created_at: string;
  sender_name?: string; // Appended by join
  property_name?: string; // Appended by join
}

export interface QuickReply {
  id: string;
  text: string;
  usageCount: number;
}

export interface TranslatedMessage {
  originalText: string;
  translatedText: string;
  language: string;
}

export interface AuraQualityScoreData {
  propertyId: string;
  propertyName: string;
  overallScore: number; // 1-100
  optimizationTips: string[]; // e.g., "Add 2 more kitchen photos"
  rankingImprovement: string; // e.g., "+10% visibility"
}

export interface MarketComparisonData {
  propertyId: string;
  propertyName: string;
  yourPrice: number;
  averageLocalPrice: number;
  suggestedPrice: number;
  currency: string;
}

export type DocumentType = 'Guest ID' | 'Property License' | 'Insurance' | 'Other';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  uploadDate: string;
  url: string; // URL to the document (e.g., Supabase storage)
  guestId?: string; // If it's a guest ID
  propertyId?: string; // If it's related to a property
}

export interface License {
  id: string;
  propertyName: string;
  licenseNumber: string;
  expiryDate: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  documentId: string; // Link to the actual document
}

export type AmenityType = 'Service' | 'Experience' | 'Physical';

export interface AmenityUpsell {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: AmenityType;
  isActive: boolean;
  propertyId?: string; // If amenity is specific to a property
}

export interface AmenityTracking {
  amenityId: string;
  amenityName: string;
  bookingCount: number;
  revenueGenerated: number;
  month: string;
}

export type AlertPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface MaintenanceAlert {
  id: string;
  propertyId: string;
  propertyName: string;
  issue: string;
  reportedBy: string;
  reportedDate: string;
  status: 'New' | 'In Progress' | 'Resolved';
  priority: AlertPriority;
}

export interface CleaningChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface CleaningChecklist {
  id: string;
  propertyId: string;
  propertyName: string;
  date: string;
  assignedTo: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  items: CleaningChecklistItem[];
}
