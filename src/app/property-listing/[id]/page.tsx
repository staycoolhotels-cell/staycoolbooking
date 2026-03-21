import type { Metadata } from 'next';

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
        .select('title, description')
        .eq('id', id)
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
        .select('*, guest:guest_id(name, avatar_url)')
        .eq('property_id', id);

    const { data: upsellAmenities } = await adminSupabase
        .from('amenities')
        .select('id, name, description, price, currency, type')
        .eq('host_id', property.host_id)
        .eq('is_active', true)
        .or(`property_id.eq.${id},property_id.is.null`);

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
        totalBookings: property.total_bookings || 0,
        images: processImages(property.images, property.image_url, property.title),
        description: property.description,
        propertyType: property.type || 'Apartment',
        maxGuests: property.max_guests || property.capacity || 2,
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        totalRooms: property.total_rooms || 1,
        area: 1200, // Still placeholder if no column
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
            latitude: 32.24, // Use actual lat/long if available in future
            longitude: 77.18,
            locationName: property.location,
            address: property.show_specific_location
                ? `${property.address_line1 || ''} ${property.address_line2 || ''}, ${property.city || ''}, ${property.state || ''} ${property.postal_code || ''}`.trim()
                : property.location,
            nearbyAttractions: [],
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
            { name: 'Cleanliness', score: 4.9, icon: 'SparklesIcon' },
            { name: 'Accuracy', score: 4.9, icon: 'CheckCircleIcon' },
            { name: 'Check-in', score: 4.9, icon: 'KeyIcon' },
            { name: 'Communication', score: 4.9, icon: 'ChatBubbleLeftRightIcon' },
            { name: 'Location', score: 4.8, icon: 'MapIcon' },
            { name: 'Value', score: 4.9, icon: 'TagIcon' }
        ],
        badges: ['Great hospitality', 'Clean', 'Great communication', 'Quiet area', 'Value for money']
    };

    return (
        <>

            <PropertyListingInteractive propertyData={propertyData as any} />
            <Footer />
        </>
    );
}
