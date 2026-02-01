import {
  User,
  Review,
  PersonalInfo,
  Preferences,
  Achievement,
  UserVerificationStatus,
  Booking,
  Property,
  Transaction,
  WishlistItem,
  Dispute,
  Campaign,
} from './types';

// ============================================================================
// DUMMY DATA GENERATION
// ============================================================================

/**
 * Creates a mock user profile.
 */
export const createMockUser = (): User => ({
  id: 'user-zenith-001',
  name: 'Alex Zenith',
  email: 'alex.zenith@example.com',
  avatar: 'https://i.pravatar.cc/150?u=alexzenith',
  avatarAlt:
    'A portrait of Alex Zenith, a young professional with a confident smile, set against a blurred city background.',
  role: 'guest',
  joinDate: '2022-08-15T10:00:00Z',
  total_bookings: 12,
  completionPercentage: 95,
  location: 'Lisbon, Portugal',
  isVerified: true,
  status: 'active',
  kyc_status: 'verified',
  verificationStatus: 'verified',
});

export const createMockUsers = (): User[] => [
  {
    id: 'user-zenith-001',
    name: 'Alex Zenith',
    email: 'alex.zenith@example.com',
    avatar: 'https://i.pravatar.cc/150?u=alexzenith',
    avatarAlt: 'A portrait of Alex Zenith',
    role: 'guest',
    joinDate: '2022-08-15T10:00:00Z',
    total_bookings: 12,
    completionPercentage: 95,
    location: 'Lisbon, Portugal',
    isVerified: true,
    status: 'active',
    kyc_status: 'verified',
    verificationStatus: 'verified',
  },
  {
    id: 'user-boreal-002',
    name: 'Bob Boreal',
    email: 'bob.boreal@example.com',
    avatar: 'https://i.pravatar.cc/150?u=bobboreal',
    avatarAlt: 'A portrait of Bob Boreal',
    role: 'host',
    joinDate: '2021-11-20T14:30:00Z',
    total_bookings: 5,
    completionPercentage: 100,
    location: 'Reykjavik, Iceland',
    isVerified: true,
    status: 'active',
    kyc_status: 'verified',
    verificationStatus: 'verified',
  },
  {
    id: 'user-umbra-003',
    name: 'Charlie Umbra',
    email: 'charlie.umbra@example.com',
    avatar: 'https://i.pravatar.cc/150?u=charlieumbra',
    avatarAlt: 'A portrait of Charlie Umbra',
    role: 'guest',
    joinDate: '2023-03-10T18:00:00Z',
    total_bookings: 2,
    completionPercentage: 80,
    location: 'Kyoto, Japan',
    isVerified: false,
    status: 'pending',
    kyc_status: 'pending',
    verificationStatus: 'unverified',
  },
  {
    id: 'user-solstice-004',
    name: 'Diana Solstice',
    email: 'diana.solstice@example.com',
    avatar: 'https://i.pravatar.cc/150?u=dianasolstice',
    avatarAlt: 'A portrait of Diana Solstice',
    role: 'guest',
    joinDate: '2020-05-01T09:00:00Z',
    total_bookings: 25,
    completionPercentage: 98,
    location: 'Santorini, Greece',
    isVerified: true,
    status: 'suspended',
    kyc_status: 'verified',
    verificationStatus: 'verified',
  },
];

/**
 * Creates mock personal information for the user.
 */
export const createMockPersonalInfo = (): PersonalInfo => ({
  user_id: 'user-zenith-001',
  bio: 'Seasoned traveler and digital nomad exploring the world one stay at a time. Lover of mountains, minimalist design, and authentic local experiences.',
  dateOfBirth: '1990-05-20',
  gender: 'Male',
  languages: ['English', 'Spanish', 'German'],
  location: 'Lisbon, Portugal',
  nationality: 'Canadian',
  occupation: 'UX Designer',
});

/**
 * Creates mock verification statuses.
 */
export const createMockVerifications = (): UserVerificationStatus => ({
  user_id: 'user-zenith-001',
  isEmailVerified: true,
  isPhoneVerified: true,
  isIdVerified: true,
  isPaymentMethodVerified: true,
});

/**
 * Creates mock user preferences.
 */
export const createMockPreferences = (): Preferences => ({
  user_id: 'user-zenith-001',
  emailNotifications: true,
  smsNotifications: false,
  instantBook: true,
  currency: 'USD',
  language: 'en-US',
  timezone: 'Europe/Lisbon',
});

/**
 * Generates mock achievements for the loyalty system.
 */
export const createMockAchievements = (): Achievement[] => [
  {
    id: 'ach-001',
    user_id: 'user-zenith-001',
    type: 'Milestone',
    title: 'Mountain Explorer',
    description: 'Completed bookings in 3 different mountain regions.',
    dateAwarded: '2023-11-20T14:30:00Z',
    icon: 'MountainIcon',
  },
  {
    id: 'ach-002',
    user_id: 'user-zenith-001',
    type: 'Milestone',
    title: 'Coastal King',
    description: 'Stayed at 5 unique beachfront properties.',
    dateAwarded: '2024-03-10T18:00:00Z',
    icon: 'WavesIcon',
  },
  {
    id: 'ach-003',
    user_id: 'user-zenith-001',
    type: 'Loyalty',
    title: 'Zenith Gold Tier',
    description: 'Achieved after 10 successful bookings.',
    dateAwarded: '2024-05-01T09:00:00Z',
    icon: 'ShieldCheckIcon',
  },
  {
    id: 'ach-004',
    user_id: 'user-zenith-001',
    type: 'Activity',
    title: 'First Review',
    description: 'Shared your first experience with the community.',
    dateAwarded: '2022-09-05T12:00:00Z',
    icon: 'StarIcon',
  },
];

/**
 * Generates mock properties to be used in bookings.
 */
const mockProperties: Partial<Property>[] = [
  {
    id: 'prop-manali-01',
    title: 'Zenith Cabin, Manali',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=500&q=80',
        alt: 'Living room',
      },
      {
        url: 'https://images.unsplash.com/photo-1582582494705-150b04040984?w=500&q=80',
        alt: 'Bedroom',
      },
    ],
    location: 'Manali, Himachal Pradesh',
    price_per_night: 150,
  },
  {
    id: 'prop-goa-02',
    title: 'Azure Beach Villa, Goa',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=500&q=80',
        alt: 'Beach view',
      },
    ],
    location: 'Goa, India',
    price_per_night: 250,
  },
  {
    id: 'prop-tokyo-03',
    title: 'Shibuya Sky Loft',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579800342936-9a2947a61d87?w=500&q=80',
        alt: 'City view',
      },
    ],
    location: 'Tokyo, Japan',
    price_per_night: 300,
  },
];

/**
 * Generates mock bookings, including upcoming and past stays.
 */
export const createMockBookings = (): (Booking & { properties: Partial<Property> })[] => [
  {
    id: 'booking-upcoming-01',
    guest_id: 'user-zenith-001',
    property_id: 'prop-manali-01',
    check_in: '2026-01-24T12:00:00Z', // 10 days from a fixed date
    check_out: '2026-01-29T12:00:00Z', // 15 days from a fixed date
    total_price: 750,
    status: 'confirmed',
    properties: mockProperties[0],
    guests: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'booking-past-01',
    guest_id: 'user-zenith-001',
    property_id: 'prop-goa-02',
    check_in: '2024-02-10T14:00:00Z',
    check_out: '2024-02-17T11:00:00Z',
    total_price: 1750,
    status: 'completed',
    properties: mockProperties[1],
    guests: 2,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'booking-past-02',
    guest_id: 'user-zenith-001',
    property_id: 'prop-tokyo-03',
    check_in: '2023-10-05T14:00:00Z',
    check_out: '2023-10-12T11:00:00Z',
    total_price: 2100,
    status: 'completed',
    properties: mockProperties[2],
    guests: 1,
    created_at: '2023-09-01T18:00:00Z',
  },
];

/**
 * Generates mock reviews written by the user.
 */
export const createMockReviews = (): Review[] => [
  {
    id: 'rev-001',
    booking_id: 'booking-past-01',
    reviewer_id: 'user-zenith-001',
    receiver_id: 'host-002',
    rating: 5,
    comment:
      'An absolutely stunning villa with breathtaking views. The host was incredibly welcoming. A perfect getaway!',
    created_at: '2024-02-20T15:00:00Z',
  },
  {
    id: 'rev-002',
    booking_id: 'booking-past-02',
    reviewer_id: 'host-003',
    receiver_id: 'user-zenith-001',
    rating: 5,
    comment:
      'Alex was a fantastic guest. Respectful, clean, and great at communicating. Would love to host again!',
    created_at: '2023-10-15T11:00:00Z',
  },
];

/**
 * Generates mock disputes.
 */
export const createMockDisputes = (): Dispute[] => [
  {
    id: 'dispute-001',
    caseNumber: 'DPT-001-2024',
    guestName: 'Alex Zenith',
    hostName: 'Maria Garcia',
    propertyName: 'Zenith Cabin, Manali',
    issueType: 'Property not as described',
    priority: 'high',
    status: 'in_progress',
    createdDate: '2024-01-20T10:00:00Z',
    lastUpdate: '2024-01-25T14:30:00Z',
  },
  {
    id: 'dispute-002',
    caseNumber: 'DPT-002-2024',
    guestName: 'Bob Boreal',
    hostName: 'Rajesh Kumar',
    propertyName: 'Azure Beach Villa, Goa',
    issueType: 'Cancellation policy disagreement',
    priority: 'medium',
    status: 'open',
    createdDate: '2024-02-10T11:00:00Z',
    lastUpdate: '2024-02-10T11:00:00Z',
  },
  {
    id: 'dispute-003',
    caseNumber: 'DPT-003-2024',
    guestName: 'Charlie Umbra',
    hostName: 'Sanjay Gupta',
    propertyName: 'Udaipur Lake Palace',
    issueType: 'Damage to property',
    priority: 'critical',
    status: 'resolved',
    createdDate: '2023-11-01T09:00:00Z',
    lastUpdate: '2023-12-01T17:00:00Z',
  },
];

/**
 * Generates mock financial transactions for the Treasury section.
 */
export const createMockTransactions = (): Transaction[] => [
  {
    id: 'txn-001',
    transactionId: 'txn-001',
    booking_id: 'booking-upcoming-01',
    date: '2026-01-09T12:00:00Z',
    type: 'payment',
    amount: 750,
    status: 'completed',
    breakdown: { accommodation: 650, service_fee: 75, taxes: 25 },
    invoice_id: 'inv-upc-01',
    guestName: 'Alex Zenith',
    hostName: 'Maria Garcia',
    propertyName: 'Zenith Cabin, Manali',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'txn-002',
    transactionId: 'txn-002',
    booking_id: 'booking-past-01',
    date: '2024-01-15T10:05:00Z',
    type: 'payment',
    amount: 1750,
    status: 'completed',
    breakdown: { accommodation: 1500, service_fee: 175, taxes: 75 },
    invoice_id: 'inv-pst-01',
    guestName: 'Alex Zenith',
    hostName: 'Rajesh Kumar',
    propertyName: 'Azure Beach Villa, Goa',
    paymentMethod: 'PayPal',
  },
  {
    id: 'txn-003',
    transactionId: 'txn-003',
    booking_id: 'booking-cancelled-01',
    date: '2024-04-05T11:00:00Z',
    type: 'refund',
    amount: -500,
    status: 'completed',
    breakdown: { accommodation: -450, service_fee: -50, taxes: 0 },
    invoice_id: 'inv-cnl-01',
    guestName: 'Alex Zenith',
    hostName: 'Sanjay Gupta',
    propertyName: 'Udaipur Lake Palace',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'txn-004',
    transactionId: 'txn-004',
    booking_id: 'booking-cancelled-02',
    date: '2024-06-01T10:00:00Z',
    type: 'refund',
    amount: -800,
    status: 'pending',
    breakdown: { accommodation: -720, service_fee: -80, taxes: 0 },
    invoice_id: 'inv-cnl-02',
    guestName: 'Alex Zenith',
    hostName: 'Priya Sharma',
    propertyName: 'Jaipur Haveli',
    paymentMethod: 'Credit Card',
  },
];

/**
 * Generates a list of mock properties for the property management page.
 */
export const createMockProperties = (): Property[] => [
  {
    id: 'prop-manali-01',
    name: 'Zenith Cabin, Manali',
    tier: 'standard',
    title: 'Zenith Cabin, Manali',
    description: 'A beautiful cabin in the Himalayas, perfect for a peaceful retreat.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=500&q=80',
        alt: 'Living room',
      },
      {
        url: 'https://images.unsplash.com/photo-1582582494705-150b04040984?w=500&q=80',
        alt: 'Bedroom',
      },
    ],
    location: 'Manali, Himachal Pradesh',
    price_per_night: 150,
    bedrooms: 2,
    bathrooms: 2,
    max_guests: 4,
    rating: 4.8,
    reviews_count: 120,
    amenities: ['wifi', 'kitchen', 'heating', 'parking'],
    status: 'active',
    created_at: '2023-01-15T12:00:00Z',
    updated_at: '2023-10-01T10:00:00Z',
  },
  {
    id: 'prop-goa-02',
    name: 'Azure Beach Villa, Goa',
    tier: 'standard',
    title: 'Azure Beach Villa, Goa',
    description: 'A luxurious villa with a private beach and infinity pool.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=500&q=80',
        alt: 'Beach view',
      },
    ],
    location: 'Goa, India',
    price_per_night: 250,
    bedrooms: 4,
    bathrooms: 4,
    max_guests: 8,
    rating: 4.9,
    reviews_count: 250,
    amenities: ['wifi', 'pool', 'air conditioning', 'kitchen', 'parking'],
    host_id: 'host-002',
    status: 'active',
    created_at: '2023-02-20T14:00:00Z',
    updated_at: '2023-11-15T16:00:00Z',
  },
  {
    id: 'prop-tokyo-03',
    name: 'Shibuya Sky Loft',
    tier: 'standard',
    title: 'Shibuya Sky Loft',
    description: 'A modern loft in the heart of Tokyo with stunning city views.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579800342936-9a2947a61d87?w=500&q=80',
        alt: 'City view',
      },
    ],
    location: 'Tokyo, Japan',
    price_per_night: 300,
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    rating: 4.7,
    reviews_count: 80,
    amenities: ['wifi', 'air conditioning', 'kitchen', 'elevator'],
    host_id: 'host-003',
    status: 'rejected',
    created_at: '2023-03-10T10:00:00Z',
    updated_at: '2023-09-20T11:00:00Z',
  },
];

/**
 * Generates mock marketing campaigns.
 */
export const createMockCampaigns = (): Campaign[] => [
  {
    id: 'campaign-001',
    name: 'Summer Getaway Promo',
    type: 'promo_code',
    status: 'active',
    start_date: '2026-06-01T00:00:00Z',
    end_date: '2026-08-31T23:59:59Z',
    budget: 5000,
    spend: 3500,
    impressions: 150000,
    clicks: 15000,
    conversions: 300,
    cpa: 11.67,
  },
  {
    id: 'campaign-002',
    name: 'New Host Welcome Email',
    type: 'email',
    status: 'completed',
    start_date: '2025-01-01T00:00:00Z',
    end_date: '2025-12-31T23:59:59Z',
    budget: 0, // Email campaigns often don't have direct spend
    spend: 0,
    impressions: 20000, // Emails sent
    clicks: 5000, // Email opens/clicks
    conversions: 100, // New listings created
    cpa: 0,
  },
  {
    id: 'campaign-003',
    name: 'Winter Wonderland Social',
    type: 'social_media',
    status: 'scheduled',
    start_date: '2026-11-15T00:00:00Z',
    end_date: '2027-01-15T23:59:59Z',
    budget: 7000,
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    cpa: 0,
  },
  {
    id: 'campaign-004',
    name: 'Early Bird Booking',
    type: 'promo_code',
    status: 'active',
    start_date: '2026-02-01T00:00:00Z',
    end_date: '2026-04-30T23:59:59Z',
    budget: 3000,
    spend: 1200,
    impressions: 80000,
    clicks: 8000,
    conversions: 150,
    cpa: 8.0,
  },
];

/**
 * Generates a mock wishlist.
 */
export const createMockWishlist = (): WishlistItem[] => [
  {
    id: 'wish-001',
    user_id: 'user-zenith-001',
    property_id: 'prop-bali-04',
    board: 'Summer Escapes',
    notes: 'Need to check availability for July. Looks amazing!',
    property: {
      id: 'prop-bali-04',
      title: 'Ubud Jungle Haven',
      images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=500&q=80'],
      location: 'Bali, Indonesia',
      price_per_night: 180,
    },
  },
  {
    id: 'wish-002',
    user_id: 'user-zenith-001',
    property_id: 'prop-kyoto-05',
    board: 'Winter Trip JP',
    notes: 'Possible stay for New Year.',
    property: {
      id: 'prop-kyoto-05',
      title: 'Kyoto Traditional Machiya',
      images: ['https://images.unsplash.com/photo-1533630412845-4d4a862b14e4?w=500&q=80'],
      location: 'Kyoto, Japan',
      price_per_night: 220,
    },
  },
];
