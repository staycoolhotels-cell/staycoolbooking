import type { Metadata } from 'next';

import PropertyListingInteractive from './components/PropertyListingInteractive';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: property } = await supabase
    .from('properties')
    .select('title, description')
    .eq('id', params.id)
    .single();

  if (!property) {
    return {
      title: 'Property Not Found',
      description: 'The property you are looking for does not exist.',
    };
  }

  return {
    title: `${property.title} - StayCool Booking`,
    description: property.description,
  };
}

// This is now an async Server Component
export default async function PropertyListingPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    redirect('/homepage');
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single();

  if (propertyError || !property) {
    console.error('Error fetching property:', propertyError);
    notFound();
  }

  const { data: host, error: hostError } = await supabase
    .from('users')
    .select('*')
    .eq('id', property.host_id)
    .single();

  if (hostError || !host) {
    console.error('Error fetching host:', hostError);
    notFound();
  }

  const { data: hostPersonalInfo, error: personalInfoError } = await supabase
    .from('user_personal_info')
    .select('bio')
    .eq('user_id', property.host_id)
    .single();

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*, guest:guest_id(name, avatar_url)')
    .eq('property_id', params.id);

  const propertyData = {
    name: property.title,
    type: property.tier,
    location: property.location,
    rating:
      reviews && reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : 0,
    reviewCount: reviews?.length || 0,
    isVerified: host.kyc_status === 'verified',
    totalBookings: 0, // Placeholder
    images: [{ id: 1, url: property.image_url, alt: property.title }],
    description: property.description,
    propertyType: property.tier,
    maxGuests: 4, // Placeholder
    bedrooms: 2, // Placeholder
    bathrooms: 1, // Placeholder
    area: 1200, // Placeholder
    highlights: ['Great view', 'Cozy atmosphere'], // Placeholder
    amenities: [], // Placeholder for amenities
    reviews:
      reviews?.map((review) => ({
        id: review.id,
        guestName: review.guest.name,
        guestAvatar: review.guest.avatar_url,
        guestAvatarAlt: ``,
        rating: review.rating,
        date: new Date(review.created_at).toLocaleDateString(),
        comment: review.comment,
        isVerifiedStay: true,
      })) || [],
    pricePerNight: property.price_per_night,
    currency: '₹', // Placeholder
    isAvailable: true, // Placeholder
    hostResponseRate: 98, // Placeholder
    hostResponseTime: 'Within 1 hour', // Placeholder
    host: {
      name: host.name,
      avatar: host.avatar_url,
      avatarAlt: ``,
      joinedDate: new Date(host.created_at).toLocaleDateString(),
      isVerified: host.kyc_status === 'verified',
      responseRate: 98,
      responseTime: 'Within 1 hour',
      totalProperties: 1,
      bio: personalInfoError ? 'No bio available.' : hostPersonalInfo?.bio || 'No bio available.',
    },
    location_details: {
      latitude: 32.24, // Placeholder
      longitude: 77.18, // Placeholder
      locationName: property.location,
      address: property.location,
      nearbyAttractions: [],
    },
    safetyFeatures: [],
    insuranceCoverage: '',
    emergencyContact: '',
  };

  return (
    <>
      
      <PropertyListingInteractive propertyData={propertyData as any} />
    </>
  );
}
