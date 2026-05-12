'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import PropertyGallery from './PropertyGallery';
import PropertyHeader from './PropertyHeader';
import PropertyDescription from './PropertyDescription';
import AmenitiesSection from './AmenitiesSection';
import ReviewsSection from './ReviewsSection';
import BookingCard from './BookingCard';
import HostProfile from './HostProfile';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const LocationMap = dynamic(() => import('./LocationMap'), { 
  ssr: false,
  loading: () => (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 min-h-[500px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Initializing map engine…</p>
      </div>
    </div>
  )
});

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
  beds: number;
  bathrooms: number;
  area: number;
  totalRooms: number;
  highlights: string[];
  amenities: Amenity[];
  upsellAmenities?: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    type: string;
  }[];
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
    gender?: string;
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
  checkInTime?: string;
  checkOutTime?: string;
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
  const searchParams = useSearchParams();
  const [showMobileBooking, setShowMobileBooking] = useState(
    searchParams.get('openBooking') === 'true'
  );
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, number>>({});
  const [isOnline, setIsOnline] = useState(true);

  // Clean up the URL query param after opening the booking sheet
  React.useEffect(() => {
    if (searchParams.get('openBooking') === 'true') {
      const url = new URL(window.location.href);
      url.searchParams.delete('openBooking');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleAmenityChange = (amenityId: string, type: string, operation: 'add' | 'remove' | 'toggle') => {
    setSelectedAmenities(prev => {
      const current = prev[amenityId] || 0;
      if (operation === 'toggle') {
        const newState = { ...prev };
        if (current > 0) delete newState[amenityId];
        else newState[amenityId] = 1;
        return newState;
      }
      if (operation === 'add') {
        return { ...prev, [amenityId]: current + 1 };
      }
      if (operation === 'remove') {
        const newState = { ...prev };
        if (current <= 1) delete newState[amenityId];
        else newState[amenityId] = current - 1;
        return newState;
      }
      return prev;
    });
  };

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

    // Track this property as 'last viewed' for home page scrolling
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('last_viewed_property', propertyData.id);
    }

    // Network status listeners
    if (typeof window !== 'undefined') {
      setIsOnline(window.navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [propertyData.id]);

  const handleToggleSave = async () => {
    if (!isOnline) {
      toast.error('Network unavailable', {
        description: 'Please check your internet connection to update your wishlist.'
      });
      return;
    }

    if (!currentUser) {
      toast.error('Login required', {
        description: 'Please log in to save properties to your wishlist.'
      });
      router.replace('/auth');
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
          console.error("Error inserting to wishlist:", { message: 'An unexpected error occurred.', details: error.details, hint: error.hint, code: error.code });
          throw error;
        }
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error('Failed to update wishlist');
      // Revert optimistic update on error
      setIsSaved(currentlySaved);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10 lg:pb-16">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  // Ensure last viewed property is set for the home page scroll logic
                  sessionStorage.setItem('last_viewed_property', propertyData.id);
                  router.push('/homepage');
                }
              }}
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

          <div className="mb-4">
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

          <div className="flex flex-col lg:flex-row gap-6 md:gap-8 relative">
            {/* Left Main Content */}
            <div className="w-full lg:w-2/3 flex flex-col gap-6 md:gap-8">
              <PropertyDescription
                description={propertyData.description}
                propertyType={propertyData.propertyType}
                maxGuests={propertyData.maxGuests}
                bedrooms={propertyData.bedrooms}
                beds={propertyData.beds}
                bathrooms={propertyData.bathrooms}
                area={propertyData.area}
                totalRooms={propertyData.totalRooms}
                highlights={propertyData.highlights}
                checkInTime={propertyData.checkInTime}
                checkOutTime={propertyData.checkOutTime}
              />

              <AmenitiesSection amenities={propertyData.amenities} />

              {propertyData.upsellAmenities && propertyData.upsellAmenities.length > 0 && (
                <div className="py-8 border-t border-white/5">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Icon name="Gem" size={24} className="text-amber-400" /> Exclusive Upgrades
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {propertyData.upsellAmenities.map(amenity => (
                      <div key={amenity.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-colors">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-white pr-2">{amenity.name}</h4>
                            <span className="text-sky-400 font-bold bg-sky-500/10 px-3 py-1 rounded-full text-sm shrink-0">
                               {amenity.currency === 'INR' || amenity.currency === '₹' ? '₹' : amenity.currency}{amenity.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed mb-4">{amenity.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-4">
                          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                            {amenity.type === 'Physical' ? 'Physical Gear' : amenity.type}
                          </div>
                          
                          {['Physical', 'Service'].includes(amenity.type) ? (
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleAmenityChange(amenity.id, amenity.type, 'remove')}
                                className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors ${selectedAmenities[amenity.id] ? 'border-pink-500/50 text-pink-400 hover:bg-pink-500/10' : 'border-white/10 text-zinc-500'}`}
                              >
                                <Icon name="MinusIcon" size={14} />
                              </button>
                              <span className="text-white font-bold w-4 text-center">{selectedAmenities[amenity.id] || 0}</span>
                              <button 
                                onClick={() => handleAmenityChange(amenity.id, amenity.type, 'add')}
                                className="w-7 h-7 flex items-center justify-center rounded-full border border-pink-500/50 text-pink-400 hover:bg-pink-500/10 transition-colors"
                              >
                                <Icon name="PlusIcon" size={14} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer relative group/checkbox">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={Boolean(selectedAmenities[amenity.id])}
                                onChange={() => handleAmenityChange(amenity.id, amenity.type, 'toggle')}
                              />
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedAmenities[amenity.id] ? 'bg-pink-500 border-pink-500 text-white' : 'border-white/20 text-transparent group-hover/checkbox:border-white/40'}`}>
                                <Icon name="CheckIcon" size={12} strokeWidth={3} />
                              </div>
                              <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${selectedAmenities[amenity.id] ? 'text-pink-400' : 'text-zinc-500 group-hover/checkbox:text-zinc-400'}`}>
                                Include
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <LocationMap
                latitude={propertyData.location_details.latitude}
                longitude={propertyData.location_details.longitude}
                locationName={propertyData.location_details.locationName}
                address={propertyData.location_details.address}
                nearbyAttractions={propertyData.location_details.nearbyAttractions}
              />

              <ReviewsSection
                reviews={propertyData.reviews}
                averageRating={propertyData.rating}
                totalReviews={propertyData.reviewCount}
                categoryRatings={propertyData.categoryRatings}
                badges={propertyData.badges}
              />

              <ThingsToKnowSection
                cancellationPolicy={propertyData.cancellationPolicy}
                houseRules={propertyData.houseRules}
                safetyProperty={propertyData.safetyProperty}
                checkInTime={propertyData.checkInTime}
                checkOutTime={propertyData.checkOutTime}
              />

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
                gender={propertyData.host.gender}
                coHostName={propertyData.host.coHostName}
                hostId={propertyData.host.id}
                propertyId={propertyData.id}
              />
            </div>

            {/* Right Sidebar (Sticky on Desktop) */}
            <div className="hidden lg:block w-full lg:w-1/3">
              <div className="sticky top-28">
                <BookingCard
                  propertyId={propertyData.id}
                  pricePerNight={propertyData.pricePerNight}
                  currency={propertyData.currency}
                  isAvailable={propertyData.isAvailable}
                  hostResponseRate={propertyData.hostResponseRate}
                  hostResponseTime={propertyData.hostResponseTime}
                  totalRooms={propertyData.totalRooms}
                  selectedAmenities={selectedAmenities}
                  upsellAmenities={propertyData.upsellAmenities}
                  rating={propertyData.rating}
                  reviewCount={propertyData.reviewCount}
                  propertyType={propertyData.propertyType}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[110] lg:hidden">
        {/* Full Booking Sheet (slide-up) */}
        {showMobileBooking && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMobileBooking(false)}
            />
            {/* Sheet */}
            <div className="relative bg-black rounded-t-3xl max-h-[90vh] overflow-y-auto pb-6">
              {/* Sheet Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              {/* Close Button */}
              <button
                onClick={() => setShowMobileBooking(false)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all z-[130] backdrop-blur-sm border border-white/10"
                aria-label="Close booking sheet"
              >
                <Icon name="X" size={20} className="text-white" strokeWidth={3} />
              </button>
              <div className="px-4 pt-16">
                <BookingCard
                  propertyId={propertyData.id}
                  pricePerNight={propertyData.pricePerNight}
                  currency={propertyData.currency}
                  isAvailable={propertyData.isAvailable}
                  hostResponseRate={propertyData.hostResponseRate}
                  hostResponseTime={propertyData.hostResponseTime}
                  totalRooms={propertyData.totalRooms}
                  selectedAmenities={selectedAmenities}
                  upsellAmenities={propertyData.upsellAmenities}
                  rating={propertyData.rating}
                  reviewCount={propertyData.reviewCount}
                  propertyType={propertyData.propertyType}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="bg-black/95 backdrop-blur-xl border-t border-sky-500/20 px-5 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">
                {propertyData.currency}{propertyData.pricePerNight.toLocaleString('en-IN')}
              </span>
              <span className="text-gray-400 text-xs">/ night</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Icon name="StarIcon" size={11} variant="solid" className="text-amber-400" />
              <span className="text-xs font-semibold text-white">{propertyData.rating.toFixed(2)}</span>
              <span className="text-xs text-gray-500">· {propertyData.reviewCount} reviews</span>
            </div>
          </div>
          <button
            onClick={() => setShowMobileBooking(true)}
            className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-black font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-sky-900/30 transition-all active:scale-95"
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyListingInteractive;
