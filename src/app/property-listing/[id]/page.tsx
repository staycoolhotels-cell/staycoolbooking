import type { Metadata } from 'next';
import { Suspense } from 'react';

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
            console.info(`Property not found or access denied for id: ${id}`);
        }
        notFound();
    }

    const fullAddress = property.show_specific_location
        ? `${property.address_line1 || ''} ${property.address_line2 || ''}, ${property.city || ''}, ${property.state || ''} ${property.postal_code || ''}`.trim()
        : property.location;

    // Fetch all auxiliary property data and nearby places concurrently in a single parallel batch
    const [
        hostRes,
        hostPersonalInfoRes,
        reviewsRes,
        upsellAmenitiesRes,
        bookingsCountRes,
        roomsListRes,
        nearbyPlacesData
    ] = await Promise.all([
        adminSupabase.from('users').select('*').eq('id', property.host_id).single(),
        adminSupabase.from('user_personal_info').select('bio, gender').eq('user_id', property.host_id).single(),
        adminSupabase.from('reviews').select('*, guest:reviewer_id(name, avatar_url)').eq('property_id', id).order('created_at', { ascending: false }),
        adminSupabase.from('amenities').select('id, name, description, price, currency, type').eq('host_id', property.host_id).eq('is_active', true).or(`property_id.eq.${id},property_id.is.null`),
        adminSupabase.from('bookings').select('*', { count: 'exact', head: true }).eq('property_id', id).neq('status', 'cancelled'),
        adminSupabase.from('rooms').select('room_type').eq('property_id', id),
        getNearbyPlaces(fullAddress, property.latitude, property.longitude)
    ]);

    const host = hostRes.data;
    if (hostRes.error || !host) {
        console.error('Error fetching host:', hostRes.error);
        notFound();
    }

    const hostPersonalInfo = hostPersonalInfoRes.data;
    const personalInfoError = hostPersonalInfoRes.error;
    const reviews = reviewsRes.data || [];
    const upsellAmenities = upsellAmenitiesRes.data || [];
    const totalBookingsCount = bookingsCountRes.count ?? 0;
    const roomsList = roomsListRes.data || [];

    // Build room type counts map
    let roomTypeCountsMap: Record<string, number> = {};
    
    // 1. Prioritize distributed counts from properties table if available
    const rawRoomTypeCounts = property.room_type_counts;
    if (rawRoomTypeCounts && typeof rawRoomTypeCounts === 'object') {
        Object.entries(rawRoomTypeCounts).forEach(([type, count]) => {
            const numCount = Number(count);
            if (type && numCount > 0) {
                roomTypeCountsMap[type] = numCount;
            }
        });
    }

    // 2. Fallback to counting actual rooms if properties.room_type_counts is empty
    if (Object.keys(roomTypeCountsMap).length === 0) {
        (roomsList || []).forEach((r: { room_type: string | null }) => {
            const t = (r.room_type || '').trim();
            if (t) roomTypeCountsMap[t] = (roomTypeCountsMap[t] || 0) + 1;
        });
    }

    // If property has 'Entire Resort' in room_types or roomTypeCountsMap, enforce only Entire Resort!
    if (
        (property.room_types && Array.isArray(property.room_types) && property.room_types.includes('Entire Resort')) ||
        roomTypeCountsMap['Entire Resort'] !== undefined
    ) {
        roomTypeCountsMap = { 'Entire Resort': 1 };
    }

    const nearbyAttractions = (nearbyPlacesData?.suggestions || []).map((p: { name: string; distance: string; type: string }) => ({
        name: p.name,
        distance: p.distance,
        type: p.type.toLowerCase().includes('cafe') ? 'restaurant' : p.type.toLowerCase().includes('spot') ? 'park' : 'attraction'
    }));

    // Helper to process amenities
    const processAmenities = (amenities: any[]) => {
        if (!amenities || !Array.isArray(amenities)) return [];
        return amenities.map((item: any, index) => {
            // Check if item is a numeric ID (e.g. 103, 2001) or numeric string (e.g. "103")
            const numId = typeof item === 'number' ? item : (typeof item === 'string' && !isNaN(Number(item)) && item.trim() !== '') ? Number(item) : null;
            if (numId !== null) {
                const standard = AMENITIES.find(a => a.id === numId);
                if (standard) {
                    return {
                        id: standard.id,
                        name: standard.name,
                        icon: standard.iconName || 'CheckCircleIcon',
                        description: standard.description || '',
                        available: true,
                    };
                }
                return {
                    id: numId,
                    name: `Amenity ${numId}`,
                    icon: 'CheckCircleIcon',
                    description: '',
                    available: true,
                };
            }

            // String name (e.g. 'Wifi', 'Hot & Cold Water')
            if (typeof item === 'string') {
                const standard = AMENITIES.find(a => a.name.toLowerCase() === item.toLowerCase());
                return {
                    id: standard ? standard.id : index,
                    name: standard ? standard.name : item,
                    icon: standard ? (standard.iconName || 'CheckCircleIcon') : 'CheckCircleIcon',
                    description: standard ? (standard.description || '') : '',
                    available: true,
                };
            }

            // Object format (e.g. { id: 103, name: 'Hot & Cold Water', available: true })
            if (item && typeof item === 'object') {
                const standard = AMENITIES.find(a => a.id === Number(item.id) || (item.name && a.name.toLowerCase() === String(item.name).toLowerCase()));
                return {
                    id: item.id !== undefined ? Number(item.id) : (standard?.id ?? index),
                    name: item.name || standard?.name || 'Amenity',
                    icon: item.icon || standard?.iconName || 'CheckCircleIcon',
                    description: item.description ?? standard?.description ?? '',
                    available: item.available !== undefined ? Boolean(item.available) : true,
                };
            }

            return {
                id: index,
                name: String(item),
                icon: 'CheckCircleIcon',
                description: '',
                available: true,
            };
        });
    };

    // Helper to process images
    const processImages = (images: any[], fallbackUrl: string, title: string) => {
        if (images && Array.isArray(images) && images.length > 0) {
            return images.map((img: any, idx) => ({
                id: idx,
                url: img.url || img, // Handle object or string
                alt: img.alt || title,
                caption: img.caption
            }));
        }
        return [{ id: 1, url: fallbackUrl, alt: title }];
    };

    const calculateAverage = (reviews: Record<string, any>[], field: string) => {
        if (!reviews || reviews.length === 0) return 0;
        const validReviews = reviews.filter(r => r[field] !== undefined && r[field] !== null);
        if (validReviews.length === 0) return 0;
        const sum = validReviews.reduce((acc, r) => acc + (r[field] || 0), 0);
        return parseFloat((sum / validReviews.length).toFixed(1));
    };

    const isEntireResort = (property.tier === 'Resort' && Array.isArray(property.room_types) && property.room_types.includes('Entire Resort')) || (Array.isArray(property.room_types) && property.room_types.length === 1 && property.room_types[0] === 'Entire Resort');

    const allRoomSpecs = (property as any).room_type_specs || (property.room_type_amenities as any)?._specs || {};
    const specsMaxGuests = Object.values(allRoomSpecs).reduce((max: number, s: any) => Math.max(max, Number(s?.guestsCount) || 0), 0);
    const resolvedMaxGuests = Math.max(specsMaxGuests, Number(property.max_guests || 0), Number(property.capacity || 0), 2);

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
        propertyType: property.tier || property.type || 'Apartment',
        maxGuests: resolvedMaxGuests,
        bedrooms: property.bedrooms || 1,
        beds: property.beds || 1,
        bathrooms: property.bathrooms || 1,
        totalRooms: isEntireResort ? 1 : (property.total_rooms || 1),
        area: property.area || 500,
        amenities: processAmenities(property.amenities),
        highlights: property.amenities && Array.isArray(property.amenities)
            ? processAmenities(property.amenities).slice(0, 3).map((a: any) => a.name).filter(Boolean)
            : ['Great location'],
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
        weekendPrice: property.weekend_price_per_night || 0,
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
            gender: hostPersonalInfo?.gender || '',
            coHostName: property.co_host_name,
            id: property.host_id,
        },
        location_details: {
            latitude: property.latitude || nearbyPlacesData?.coordinates?.lat || null,
            longitude: property.longitude || nearbyPlacesData?.coordinates?.lng || null,
            locationName: property.location,
            address: fullAddress,
            nearbyAttractions: nearbyAttractions,
        },
        cancellationPolicy: {
            title: 'Cancellation policy',
            description: property.cancellation_policy || 'Free cancellation for 48 hours.',
            linkText: 'Read more'
        },
        checkInTime: property.check_in_time || '12:00 PM',
        checkOutTime: property.check_out_time || '11:00 AM',
        houseRules: {
            title: 'House rules',
            rules: [
                `Check-in after ${property.check_in_time || '12:00 PM'}`,
                `Checkout before ${property.check_out_time || '11:00 AM'}`,
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
        badges: ['Great hospitality', 'Clean', 'Great communication', 'Quiet area', 'Value for money'],
        bulkBookingDiscount: isEntireResort ? 0 : (property.bulk_booking_discount !== undefined && property.bulk_booking_discount !== null ? property.bulk_booking_discount : 10),
        roomTypeCounts: roomTypeCountsMap,
        roomTypeAmenities: property.room_type_amenities || {},
        roomTypePrices: property.room_type_prices || {},
        roomTypeWeekendPrices: property.room_type_weekend_prices || {},
        roomTypeSpecs: (property as any).room_type_specs || (property.room_type_amenities as any)?._specs || {},
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
            <Suspense fallback={null}>
                <PropertyListingInteractive propertyData={propertyData as any} />
            </Suspense>
            <Footer />
        </>
    );
}

