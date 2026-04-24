import type { Metadata } from 'next';

import { getNearbyPlaces } from '@/lib/google-places';
import { AMENITIES } from '@/lib/amenities';
import PropertyListingInteractive from '../components/PropertyListingInteractive';
import Footer from '../../homepage/components/Footer';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

// Force dynamic rendering to ensure real-time updates
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    // Use Admin Client to bypass RLS
    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: property } = await adminSupabase
        .from('properties')
        .select('title, description, image_url, location, city, state')
        .eq('id', id)
        .single();

    if (!property) {
        return {
            title: 'Property Not Found',
            description: 'The property you are looking for does not exist.',
        };
    }

    const title = `${property.title} - StayCool Booking`;
    const description = property.description 
        ? `${property.description.slice(0, 150)} | Book on StayCool Bookings` 
        : `Book your stay at ${property.title} in ${property.city || property.location} on StayCool Bookings. Find the best hotels and villas.`;
    const imageUrl = property.image_url || '/assets/images/logo.png';
    const canonicalUrl = `https://staycoolbooking.com/property-listing/${id}`;

    return {
        title,
        description,
        keywords: [
            property.title, 
            property.city || '', 
            property.state || '', 
            'staycool', 
            'staycool booking', 
            'staycool bookings', 
            'hotel booking', 
            'luxury stays', 
            'vacation rentals'
        ],
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: 'StayCool Booking',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: property.title,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}


// This is now an async Server Component
export default async function PropertyListingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!id) {
        redirect('/homepage');
    }

    // Use Admin Client to bypass RLS for public property listing
    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: property, error: propertyError } = await adminSupabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

    if (!property) {
        // Only log as error if propertyError has meaningful content
        if (propertyError && (propertyError.message || propertyError.code || propertyError.details)) {
            console.error('Error fetching property:', propertyError);
        } else {
            console.log(`Property not found or access denied for id: ${id}`);
        }
        notFound();
    }

    const { data: host, error: hostError } = await adminSupabase
        .from('users')
        .select('*')
        .eq('id', property.host_id)
        .single();

    if (hostError || !host) {
        console.error('Error fetching host:', hostError);
        notFound();
    }

    const { data: hostPersonalInfo, error: personalInfoError } = await adminSupabase
        .from('user_personal_info')
        .select('bio')
        .eq('user_id', property.host_id)
        .single();

    const { data: reviews, error: reviewsError } = await adminSupabase
        .from('reviews')
        .select('*, guest:reviewer_id(name, avatar_url)')
        .eq('property_id', id)
        .order('created_at', { ascending: false });

    const { data: upsellAmenities } = await adminSupabase
        .from('amenities')
        .select('id, name, description, price, currency, type')
        .eq('host_id', property.host_id)
        .eq('is_active', true)
        .or(`property_id.eq.${id},property_id.is.null`);

    // Fetch real-time booking count (excluding cancelled)
    const { count: totalBookingsCount } = await adminSupabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', id)
        .neq('status', 'cancelled');

    // Fetch real-time nearby places using Google Places API
    const fullAddress = property.show_specific_location
        ? `${property.address_line1 || ''} ${property.address_line2 || ''}, ${property.city || ''}, ${property.state || ''} ${property.postal_code || ''}`.trim()
        : property.location;
    
    const nearbyPlacesData = await getNearbyPlaces(fullAddress, property.latitude, property.longitude);
    const nearbyAttractions = (nearbyPlacesData?.suggestions || []).map(p => ({
        name: p.name,
        distance: p.distance,
        type: p.type.toLowerCase().includes('cafe') ? 'restaurant' : p.type.toLowerCase().includes('spot') ? 'park' : 'attraction'
    }));

    // Helper to process amenities
    const processAmenities = (amenities: any[]) => {
        if (!amenities || !Array.isArray(amenities)) return [];
        return amenities.map((item, index) => {
            if (typeof item === 'string') {
                return {
                    id: index,
                    name: item,
                    icon: 'CheckCircleIcon', // Default icon
                    description: '',
                    available: true,
                };
            }
            // Fallback for existing amenities with missing icons
            if (item && typeof item === 'object' && !item.icon) {
                 const standard = AMENITIES.find(a => a.id === item.id || a.name === item.name);
                 if (standard) {
                     return { ...item, icon: standard.iconName };
                 }
            }
            return item;
        });
    };

    // Helper to process images
    const processImages = (images: any[], fallbackUrl: string, title: string) => {
        if (images && Array.isArray(images) && images.length > 0) {
            return images.map((img, idx) => ({
                id: idx,
                url: img.url || img, // Handle object or string
                alt: img.alt || title,
                caption: img.caption
            }));
        }
        return [{ id: 1, url: fallbackUrl, alt: title }];
    };

    const calculateAverage = (reviews: any[], field: string) => {
        if (!reviews || reviews.length === 0) return 0;
        const validReviews = reviews.filter(r => r[field] !== undefined && r[field] !== null);
        if (validReviews.length === 0) return 0;
        const sum = validReviews.reduce((acc, r) => acc + (r[field] || 0), 0);
        return parseFloat((sum / validReviews.length).toFixed(1));
    };

    const propertyData = {
        id: property.id,
        name: property.title,
        type: property.tier || property.type || 'Standard',
        location: property.show_specific_location
            ? `${property.address_line1 ? property.address_line1 + ', ' : ''}${property.city}, ${property.state}`
            : property.location,
        rating:
            reviews && reviews.length > 0
                ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
                : 0,
        reviewCount: reviews?.length || 0,
        isVerified: host.kyc_status === 'verified',
        totalBookings: totalBookingsCount || 0,
        images: processImages(property.images, property.image_url, property.title),
        description: property.description,
        propertyType: property.type || 'Apartment',
        maxGuests: property.max_guests || property.capacity || 2,
        bedrooms: property.bedrooms || 1,
        beds: property.beds || 1,
        bathrooms: property.bathrooms || 1,
        totalRooms: property.total_rooms || 1,
        area: property.area || 500,
        highlights: property.amenities && Array.isArray(property.amenities) ? property.amenities.slice(0, 3).map((a: any) => typeof a === 'string' ? a : a.name) : ['Great location'],
        amenities: processAmenities(property.amenities),
        upsellAmenities: upsellAmenities || [],
        reviews:
            reviews?.map((review) => ({
                id: review.id,
                guestName: review.guest?.name || 'Anonymous',
                guestAvatar: review.guest?.avatar_url || '',
                guestAvatarAlt: `${review.guest?.name}'s avatar`,
                rating: review.rating,
                date: new Date(review.created_at).toLocaleDateString(),
                comment: review.comment,
                isVerifiedStay: true,
            })) || [],
        pricePerNight: property.price_per_night,
        currency: '₹',
        isAvailable: true,
        hostResponseRate: 98, // Placeholder as no data in DB
        hostResponseTime: 'Within 1 hour', // Placeholder
        host: {
            name: host.name,
            avatar: host.avatar_url,
            avatarAlt: `${host.name}'s avatar`,
            joinedDate: new Date(host.created_at).toLocaleDateString(),
            isVerified: host.kyc_status === 'verified',
            responseRate: 98,
            responseTime: 'Within 1 hour',
            totalProperties: 1,
            bio: personalInfoError ? 'No bio available.' : hostPersonalInfo?.bio || 'No bio available.',
            coHostName: property.co_host_name,
            id: property.host_id,
        },
        location_details: {
            latitude: property.show_specific_location ? (property.latitude || nearbyPlacesData?.coordinates?.lat) : null,
            longitude: property.show_specific_location ? (property.longitude || nearbyPlacesData?.coordinates?.lng) : null,
            locationName: property.location,
            address: fullAddress,
            nearbyAttractions: nearbyAttractions,
        },
        cancellationPolicy: {
            title: 'Cancellation policy',
            description: property.cancellation_policy || 'Free cancellation for 48 hours.',
            linkText: 'Read more'
        },
        houseRules: {
            title: 'House rules',
            rules: [
                'Check-in after 3:00 PM',
                'Checkout before 11:00 AM',
                ...(property.max_guests ? [`${property.max_guests} guests maximum`] : []),
                ...(property.rules || [])
            ],
            linkText: 'Read more'
        },
        safetyProperty: {
            title: 'Safety & property',
            items: property.safety_items && property.safety_items.length > 0
                ? property.safety_items
                : ['No specific safety features reported'],
            linkText: 'Read more'
        },
        categoryRatings: [
            { name: 'Cleanliness', score: calculateAverage(reviews || [], 'cleanliness_rating'), icon: 'SparklesIcon' },
            { name: 'Accuracy', score: calculateAverage(reviews || [], 'accuracy_rating'), icon: 'CheckCircleIcon' },
            { name: 'Check-in', score: calculateAverage(reviews || [], 'check_in_rating'), icon: 'KeyIcon' },
            { name: 'Communication', score: calculateAverage(reviews || [], 'communication_rating'), icon: 'ChatBubbleLeftRightIcon' },
            { name: 'Location', score: calculateAverage(reviews || [], 'location_rating'), icon: 'MapIcon' },
            { name: 'Value', score: calculateAverage(reviews || [], 'value_rating'), icon: 'TagIcon' }
        ],
        badges: ['Great hospitality', 'Clean', 'Great communication', 'Quiet area', 'Value for money']
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LodgingBusiness',
        name: propertyData.name,
        description: propertyData.description,
        image: propertyData.images[0]?.url,
        url: `https://staycoolbooking.com/property-listing/${propertyData.id}`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: propertyData.location_details.address,
            addressLocality: property.city,
            addressRegion: property.state,
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: propertyData.location_details.latitude,
            longitude: propertyData.location_details.longitude,
        },
        ...(propertyData.reviewCount > 0 && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: propertyData.rating,
                reviewCount: propertyData.reviewCount,
            },
        }),
        priceRange: `${propertyData.currency}${propertyData.pricePerNight} per night`,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PropertyListingInteractive propertyData={propertyData as any} />
            <Footer />
        </>
    );
}

