'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import PropertyGallery from './PropertyGallery';
import PropertyHeader from './PropertyHeader';
import PropertyDescription from './PropertyDescription';
import AmenitiesSection from './AmenitiesSection';
import ReviewsSection from './ReviewsSection';
import BookingCard from './BookingCard';
import HostProfile from './HostProfile';
import LocationMap from './LocationMap';
import ThingsToKnowSection from './ThingsToKnowSection';
import { supabase } from '@/lib/supabaseClient';

interface PropertyImage {
  id: number;
  url: string;
  alt: string;
  caption?: string;
}

interface Amenity {
  id: number;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

interface Review {
  id: number;
  guestName: string;
  guestAvatar: string;
  guestAvatarAlt: string;
  rating: number;
  date: string;
  comment: string;
  images?: Array<{ url: string; alt: string }>;
  hostResponse?: {
    message: string;
    date: string;
  };
  isVerifiedStay: boolean;
}

interface SafetyFeature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface PropertyData {
  id: string;
  name: string;
  type: string;
  location: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  totalBookings: number;
  images: PropertyImage[];
  description: string;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  totalRooms: number;
  highlights: string[];
  amenities: Amenity[];
  reviews: Review[];
  pricePerNight: number;
  currency: string;
  isAvailable: boolean;
  hostResponseRate: number;
  hostResponseTime: string;
  host: {
    name: string;
    avatar: string;
    avatarAlt: string;
    joinedDate: string;
    isVerified: boolean;
    responseRate: number;
    responseTime: string;
    totalProperties: number;
    bio: string;
    coHostName?: string;
    id: string;
  };
  location_details: {
    latitude: number;
    longitude: number;
    locationName: string;
    address: string;
    nearbyAttractions: Array<{
      name: string;
      distance: string;
      type: string;
    }>;
  };
  cancellationPolicy: {
    title: string;
    description: string;
    linkText: string;
  };
  houseRules: {
    title: string;
    rules: string[];
    linkText: string;
  };
  safetyProperty: {
    title: string;
    items: string[];
    linkText: string;
  };
  categoryRatings?: { name: string; score: number; icon: string }[];
  badges?: string[];
}

interface PropertyListingInteractiveProps {
  propertyData: PropertyData;
}

const PropertyListingInteractive = ({ propertyData }: PropertyListingInteractiveProps) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    const fetchUserAndWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);

        const { data: wishlistItem } = await supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', propertyData.id)
          .maybeSingle();

        if (wishlistItem) {
          setIsSaved(true);
        }
      }
    };

    fetchUserAndWishlist();
  }, [propertyData.id]);

  const handleToggleSave = async () => {
    if (!currentUser) {
      alert("Please log in to save properties to your wishlist.");
      router.push('/auth');
      return;
    }

    const currentlySaved = isSaved;

    // Optimistic UI update
    setIsSaved(!currentlySaved);

    try {
      if (currentlySaved) {
        // Remove from wishlist
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('property_id', propertyData.id);
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlist')
          .insert([
            {
              user_id: currentUser.id,
              property_id: propertyData.id
            }
          ]);

        if (error) {
          console.error("Error inserting to wishlist:", { message: error.message, details: error.details, hint: error.hint, code: error.code });
          throw error;
        }
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      // Revert optimistic update on error
      setIsSaved(currentlySaved);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/homepage')}
              className="group flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl hover:border-white/30 hover:bg-white/[0.05] transition-all duration-300"
            >
              <Icon
                name="ArrowLeftIcon"
                size={20}
                className="text-white/60 group-hover:text-white group-hover:-translate-x-1 transition-all duration-300"
              />
              <span className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors duration-300">
                Back to Properties
              </span>
            </button>
          </div>

          <div className="mb-8">
            <PropertyHeader
              name={propertyData.name}
              type={propertyData.type}
              location={propertyData.location}
              rating={propertyData.rating}
              reviewCount={propertyData.reviewCount}
              isVerified={propertyData.isVerified}
              totalBookings={propertyData.totalBookings}
              isSaved={isSaved}
              onSave={handleToggleSave}
            />
          </div>

          <div className="mb-8 max-w-5xl mx-auto">
            <PropertyGallery images={propertyData.images} propertyName={propertyData.name} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
              <PropertyDescription
                description={propertyData.description}
                propertyType={propertyData.propertyType}
                maxGuests={propertyData.maxGuests}
                bedrooms={propertyData.bedrooms}
                bathrooms={propertyData.bathrooms}
                area={propertyData.area}
                highlights={propertyData.highlights}
              />
            </div>

            <div className="lg:col-span-2 space-y-8">
              <AmenitiesSection amenities={propertyData.amenities} />

              <ReviewsSection
                reviews={propertyData.reviews}
                averageRating={propertyData.rating}
                totalReviews={propertyData.reviewCount}
                categoryRatings={propertyData.categoryRatings}
                badges={propertyData.badges}
              />

              <LocationMap
                latitude={propertyData.location_details.latitude}
                longitude={propertyData.location_details.longitude}
                locationName={propertyData.location_details.locationName}
                address={propertyData.location_details.address}
                nearbyAttractions={propertyData.location_details.nearbyAttractions}
              />

              <ThingsToKnowSection
                cancellationPolicy={propertyData.cancellationPolicy}
                houseRules={propertyData.houseRules}
                safetyProperty={propertyData.safetyProperty}
              />
            </div>

            <div className="lg:col-span-1">
              <BookingCard
                propertyId={propertyData.id}
                pricePerNight={propertyData.pricePerNight}
                currency={propertyData.currency}
                isAvailable={propertyData.isAvailable}
                hostResponseRate={propertyData.hostResponseRate}
                hostResponseTime={propertyData.hostResponseTime}
                totalRooms={propertyData.totalRooms}
              />
            </div>

            <div className="lg:col-span-3">
              <HostProfile
                name={propertyData.host.name}
                avatar={propertyData.host.avatar}
                avatarAlt={propertyData.host.avatarAlt}
                joinedDate={propertyData.host.joinedDate}
                isVerified={propertyData.host.isVerified}
                responseRate={propertyData.host.responseRate}
                responseTime={propertyData.host.responseTime}
                totalProperties={propertyData.host.totalProperties}
                bio={propertyData.host.bio}
                coHostName={propertyData.host.coHostName}
                hostId={propertyData.host.id}
                propertyId={propertyData.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyListingInteractive;
