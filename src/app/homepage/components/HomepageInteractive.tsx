'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import UltraLuxuryHeroSection from './UltraLuxuryHeroSection';
import SearchBar from './SearchBar';
import StayTypeFilter from './StayTypeFilter';
import PopularDestinations from './PopularDestinations';
import PropertyCard from './PropertyCard';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-900/50 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Synchronizing Maps…</p>
    </div>
  )
});


import BecomeHostCTA from './BecomeHostCTA';
import TrustIndicators from './TrustIndicators';
import NewsletterSection from './NewsletterSection';
import HowItWorksSection from './HowItWorksSection';
import Footer from './Footer';
import Icon from '@/components/ui/AppIcon';
import useIntersectionObserver from './useIntersectionObserver';
import CursorSpotlight from '@/components/ui/CursorSpotlight';
import { supabase } from '@/lib/supabaseClient';

import { motion } from 'framer-motion';
import { Property, User } from '@/lib/types';
import { useAppStore } from '@/lib/store';

// Animation wrapper for sections
interface AnimatedSectionProps {
  children: React.ReactNode;
}

const AnimatedSection = ({ children }: AnimatedSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

// Types moved to lib/types.ts or using specific local interfaces for UI needs

interface PropertyForCard {
  id: string;
  title: string;
  location: string;
  type: string;
  price: number;
  rating: number;
  reviews: number;
  images: { url: string; alt: string }[];
  amenities: string[];
  instantBook: boolean;
  host: {
    verified: boolean;
  };
}

const mapPropertyForCard = (property: Property): PropertyForCard => {
  let displayImages: { url: string; alt: string }[] = [];

  if (property.images && property.images.length > 0) {
    displayImages = property.images.map((img: any) => {
      if (typeof img === 'string') return { url: img, alt: property.title || property.name };
      if (img && typeof img === 'object' && img.url) return { url: img.url, alt: img.alt || property.title || property.name };
      return { url: '/assets/images/no_image.png', alt: 'No Image' };
    });
  } else if (property.image_url) {
    displayImages = [{ url: property.image_url, alt: property.title || property.name }];
  } else {
    displayImages = [{ url: '/assets/images/no_image.png', alt: 'No Image' }];
  }

  return {
    id: property.id,
    title: property.title || property.name,
    location: property.location,
    type: property.tier || 'Elite',
    price: property.price_per_night || 0,
    rating: parseFloat((Math.random() * (5.0 - 4.0) + 4.0).toFixed(2)), // Random rating 4.0-5.0
    reviews: Math.floor(Math.random() * 200) + 10, // Random reviews
    images: displayImages,
    amenities: [], // Placeholder
    instantBook: true, // Placeholder
    host: { verified: true }, // Placeholder
  };
};

interface HomepageInteractiveProps {
  initialProperties: Property[];
}

const HomepageInteractive: React.FC<HomepageInteractiveProps> = ({ initialProperties }) => {
  const router = useRouter();
  const { 
    properties: cachedProperties, 
    setProperties, 
    currentUser: cachedUser, 
    setCurrentUser: setStoreUser,
    wishlistIds: cachedWishlist,
    setWishlistIds 
  } = useAppStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedStayType, setSelectedStayType] = useState('hotel');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchLocation, setSearchLocation] = useState<string>('');

  // Local state for filtered results only
  const [filteredProperties, setFilteredProperties] = useState<PropertyForCard[]>([]);

  // Location-based sorting
  const [userCity, setUserCity] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [showLocationBanner, setShowLocationBanner] = useState(false);

  // Sync initial properties to store on mount
  useEffect(() => {
    if (initialProperties && initialProperties.length > 0) {
      setProperties(initialProperties);
    }
  }, [initialProperties, setProperties]);

  const allProperties = useMemo(() => {
    // Prefer initial properties from server (most fresh), then fallback to store/cache
    const propsToUse = (initialProperties && initialProperties.length > 0) 
      ? initialProperties 
      : cachedProperties;
    return propsToUse.map(mapPropertyForCard);
  }, [cachedProperties, initialProperties]);

  const savedProperties = cachedWishlist;
  const currentUser = cachedUser;

  // Dynamic Counts Calculation
  const counts = useMemo(() => {
    const calc = {
      all: allProperties.length,
      hotel: 0,
      homestay: 0,
      tent: 0,
      wooden: 0,
      dormitory: 0,
      apartment: 0,
      resort: 0,
      villa: 0,
    };

    allProperties.forEach((p) => {
      const type = p.type.toLowerCase();
      if (type.includes('hotel')) calc.hotel++;
      else if (type.includes('homestay') || type.includes('home')) calc.homestay++;
      else if (type.includes('tent') || type.includes('camp')) calc.tent++;
      else if (type.includes('wooden') || type.includes('cabin')) calc.wooden++;
      else if (type.includes('dorm') || type.includes('hostel')) calc.dormitory++;
      else if (type.includes('apartment') || type.includes('flat')) calc.apartment++;
      else if (type.includes('villa')) calc.villa++;
      else if (type.includes('resort')) calc.resort++;
    });

    return calc;
  }, [allProperties]);

  const stayTypes = [
    { id: 'all', name: 'All Stays', icon: 'HomeIcon', count: counts.all },
    { id: 'hotel', name: 'Hotel Rooms', icon: 'BuildingOffice2Icon', count: counts.hotel },
    { id: 'homestay', name: 'Home Stays', icon: 'HomeIcon', count: counts.homestay },
    { id: 'villa', name: 'Villas', icon: 'VillaIcon', count: counts.villa },
    { id: 'tent', name: 'Tents', icon: 'TentIcon', count: counts.tent },
    { id: 'wooden', name: 'Wooden Stays', icon: 'HomeModernIcon', count: counts.wooden },
    { id: 'dormitory', name: 'Dormitory Stays', icon: 'UserGroupIcon', count: counts.dormitory },
    { id: 'apartment', name: 'Apartment Stays', icon: 'Building2', count: counts.apartment },
    { id: 'resort', name: 'Resorts', icon: 'Palmtree', count: counts.resort },
  ];

  // 🌍 Geolocation: triggered by user clicking the banner
  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocationStatus('loading');
    setShowLocationBanner(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.county ||
            null;
          if (city) setUserCity(city);
          setLocationStatus('granted');
          localStorage.setItem('sc_location_preference', 'granted');
        } catch {
          setLocationStatus('denied');
        }
      },
      () => {
        setLocationStatus('denied');
        localStorage.setItem('sc_location_preference', 'denied');
      },
      { timeout: 8000 }
    );
  };

  // Check location permission and preference on mount
  useEffect(() => {
    const checkLocationPersistence = async () => {
      if (typeof window === 'undefined') return;

      const preference = localStorage.getItem('sc_location_preference');

      // If user already dismissed or denied, don't show banner
      if (preference === 'dismissed' || preference === 'denied') {
        return;
      }

      // If permission is already granted in the browser, just request location silently
      if (typeof navigator !== 'undefined' && navigator.permissions) {
        try {
          // Geolocation permission query might not be supported in all environments
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'granted') {
            requestLocation();
            return;
          } else if (status.state === 'denied') {
            // Respect browser-level denial
            return;
          }
        } catch (e) {
          console.warn("Permissions API check skipped:", e);
        }
      }

      // If preference is already granted but we didn't trigger via permission API above
      if (preference === 'granted') {
        requestLocation();
        return;
      }

      // If no preference set and not already granted/denied, show the banner
      if (!preference) {
        // Delay showing the banner to avoid it being the LCP element
        const timer = setTimeout(() => {
          setShowLocationBanner(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    checkLocationPersistence();
  }, []);

  useEffect(() => {
    setIsHydrated(true);

    // Fetch user and their wishlist
    const fetchUserAndWishlist = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Fetch full profile from 'users' table to get name, role, status etc.
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          setStoreUser(profileData as User);
        } else {
          // Fallback to construction from metadata if profile record is not yet available
          const fallbackUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: authUser.user_metadata?.role || 'guest',
            status: authUser.user_metadata?.status || (authUser.user_metadata?.role === 'host' ? 'pending' : 'active'),
            created_at: authUser.created_at,
            avatar_url: authUser.user_metadata?.avatar_url
          };
          setStoreUser(fallbackUser);
        }

        const { data: wishlistData, error, status } = await supabase
          .from('wishlist')
          .select('property_id')
          .eq('user_id', authUser.id);

        if (error) {
          console.error("Wishlist Fetch Error:", error, status);
        } else {
          console.log("Fetched wishlist items on load:", wishlistData);
        }

        if (wishlistData) {
          setWishlistIds(wishlistData.map((w: any) => w.property_id));
        }
      }
    };

    fetchUserAndWishlist();
  }, []);

  useEffect(() => {
    let filtered = allProperties;

    // 1. Filter by Search Location
    if (searchLocation && searchLocation.trim()) {
      const q = searchLocation.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Selected Stay Type
    if (selectedStayType !== 'all') {
      filtered = filtered.filter((p) => {
        const type = p.type.toLowerCase();
        if (selectedStayType === 'hotel') return type.includes('hotel');
        if (selectedStayType === 'homestay') return type.includes('homestay') || type.includes('home');
        if (selectedStayType === 'tent') return type.includes('tent') || type.includes('camp');
        if (selectedStayType === 'wooden') return type.includes('wooden') || type.includes('cabin');
        if (selectedStayType === 'dormitory') return type.includes('dorm') || type.includes('hostel');
        if (selectedStayType === 'apartment') return type.includes('apartment') || type.includes('flat');
        if (selectedStayType === 'villa') return type.includes('villa');
        if (selectedStayType === 'resort') return type.includes('resort');
        return type.includes(selectedStayType.toLowerCase());
      });
    }

    setFilteredProperties(filtered);
  }, [selectedStayType, searchLocation, allProperties]);

  // Handle scrolling to last viewed property
  useEffect(() => {
    if (!isHydrated) return;

    const lastPropertyId = sessionStorage.getItem('last_viewed_property');
    if (!lastPropertyId) return;

    // 1. Check if the property is in the CURRENT filtered list
    const isVisible = filteredProperties.some(p => p.id === lastPropertyId);

    if (!isVisible) {
      // 2. If not visible, find its category from allProperties and switch to it
      const targetProperty = allProperties.find(p => p.id === lastPropertyId);
      if (targetProperty) {
        const type = targetProperty.type.toLowerCase();
        let matchedType = 'all';
        
        if (type.includes('hotel')) matchedType = 'hotel';
        else if (type.includes('homestay') || type.includes('home')) matchedType = 'homestay';
        else if (type.includes('villa')) matchedType = 'villa';
        else if (type.includes('tent') || type.includes('camp')) matchedType = 'tent';
        else if (type.includes('wooden') || type.includes('cabin')) matchedType = 'wooden';
        else if (type.includes('dorm') || type.includes('hostel')) matchedType = 'dormitory';
        else if (type.includes('apartment') || type.includes('flat')) matchedType = 'apartment';
        else if (type.includes('resort')) matchedType = 'resort';

        if (matchedType !== selectedStayType) {
          setSelectedStayType(matchedType);
          return; // Wait for the next effect trigger with updated filteredProperties
        }
      }
    }

    // 3. Scroll to the element once it's confirmed visible
    let retryCount = 0;
    const maxRetries = 10;
    let timeoutId: NodeJS.Timeout;
    
    const scrollToElement = () => {
      const element = document.getElementById(`property-${lastPropertyId}`);
      if (element) {
        // High-precision scroll
        const offset = 120; // Account for sticky headers
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Visual feedback
        element.classList.add('ring-4', 'ring-sky-500', 'ring-offset-8', 'ring-offset-black', 'scale-[1.02]', 'z-50', 'transition-all', 'duration-700');
        
        timeoutId = setTimeout(() => {
          element.classList.remove('ring-4', 'ring-sky-500', 'ring-offset-8', 'ring-offset-black', 'scale-[1.02]');
          sessionStorage.removeItem('last_viewed_property');
        }, 3000);
      } else if (retryCount < maxRetries) {
        retryCount++;
        timeoutId = setTimeout(scrollToElement, 200);
      }
    };

    timeoutId = setTimeout(scrollToElement, 600); // Start sooner but with retry logic

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isHydrated, filteredProperties, allProperties, selectedStayType]);


  const handleSearch = (filters: any) => {
    // Determine location and stay type from filters object or direct parameters
    const locationStr = typeof filters === 'string' ? filters.trim() : (filters?.location?.trim() || '');
    const stayTypeStr = filters?.stayType || 'all';
    const dates = filters?.dates;

    // Update state - this will trigger the centralized filtering useEffect
    setSearchLocation(locationStr);
    setSelectedStayType(stayTypeStr);

    if (dates) {
      console.log('Searching for dates:', dates);
      // Backend filtering for dates could be added here
    }

    // Only scroll on an actual search (not on cancel which sends empty filters)
    const isActualSearch = !!(locationStr || dates);
    if (isActualSearch) {
      setTimeout(() => {
        const section = document.getElementById('featured-collections');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleToggleSaveProperty = async (propertyId: string) => {
    if (!currentUser) {
      alert("Please log in to save properties to your wishlist.");
      router.replace('/auth');
      return;
    }

    const isCurrentlySaved = savedProperties.includes(propertyId);
    const newWishlist = isCurrentlySaved 
      ? savedProperties.filter((id) => id !== propertyId) 
      : [...savedProperties, propertyId];

    // Optimistic store update
    setWishlistIds(newWishlist);

    try {
      if (isCurrentlySaved) {
        // Remove from wishlist
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('property_id', propertyId);
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlist')
          .insert([
            {
              user_id: currentUser.id,
              property_id: propertyId
            }
          ]);

        if (error) {
          console.error("Error inserting to wishlist:", { message: 'An unexpected error occurred.', details: error.details, hint: error.hint, code: error.code });
          throw error;
        }
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      // Revert optimistic update on error
      setWishlistIds(isCurrentlySaved ? [...savedProperties, propertyId] : savedProperties.filter(id => id !== propertyId));
    }
  };

  if (!isHydrated) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center overflow-x-hidden">
      <CursorSpotlight />

      {/* 📍 Location Permission Modal - Centered Overlay */}
      {showLocationBanner && locationStatus === 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLocationBanner(false)}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="relative z-10 mx-4 sm:mx-0 w-[calc(100%-2rem)] max-w-sm bg-zinc-900 border border-zinc-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden"
          >
            {/* Glow bg */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-sky-500/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Pulsing Icon */}
            <div className="relative flex items-center justify-center mb-6 mt-2">
              <motion.div
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                  className="w-13 h-13 rounded-full bg-sky-500/20 flex items-center justify-center p-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8 8 0 10-16 0c0 3.63 1.556 6.326 3.5 8.327a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              </motion.div>
            </div>

            <h2 className="font-heading text-2xl font-bold text-white mb-2">Find Stays Near You</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">
              Allow location access to see properties in your city first and get personalised recommendations.
            </p>

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={requestLocation}
                className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-sky-500/25 text-sm"
              >
                Allow Location Access
              </motion.button>
              <button
                onClick={() => {
                  setShowLocationBanner(false);
                  localStorage.setItem('sc_location_preference', 'dismissed');
                }}
                className="w-full py-3 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detecting spinner */}
      {locationStatus === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 py-4 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-2xl shadow-xl">
            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-zinc-300 font-medium">Detecting your location…</span>
          </div>
        </div>
      )}
      {/* 1. HERO SECTION: Full-width for immersive feel */}
      <div className="w-full">
        <UltraLuxuryHeroSection onSearch={handleSearch} />
      </div>

      {/* 2. MAIN CONTENT CONTAINER: Constrained to 1440px for professional desktop fit */}
      <main className="w-full max-w-[1440px] px-6 sm:px-6 lg:px-12 flex flex-col items-center relative">
        {/* 3. LAYOUT SECTIONS */}
        <div className="w-full space-y-24 py-20">
          <AnimatedSection>
            <HowItWorksSection />
          </AnimatedSection>

          <AnimatedSection>
            <StayTypeFilter
              stayTypes={stayTypes}
              selectedType={selectedStayType}
              onTypeSelect={(typeId) => {
                setSelectedStayType(typeId);
                setTimeout(() => {
                  const section = document.getElementById('featured-collections');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
            />
          </AnimatedSection>

          <AnimatedSection>
            <div id="featured-collections" className="w-full">
              {/* Premium Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
                <div className="space-y-4 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">Curated Excellence</span>
                  </div>

                  <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[0.9]">
                    {searchLocation 
                      ? `Stays in ${searchLocation}`
                      : userCity
                        ? `Stays near ${userCity}`
                        : selectedStayType === 'all'
                          ? 'Featured Collections'
                          : `Top Rated ${selectedStayType}s`}
                  </h2>

                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="font-sans text-base sm:text-lg text-zinc-400 font-medium">
                      Discover our hand-picked selection of <span className="text-zinc-100 font-bold">{filteredProperties.length} elite {filteredProperties.length === 1 ? 'property' : 'properties'}</span>
                    </p>
                    {userCity && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-zinc-700/50 rounded-full text-xs font-bold text-sky-400 shadow-lg shadow-sky-500/5"
                      >
                        <Icon name="MapPinIcon" size={14} className="text-sky-500" />
                        Curated in {userCity}
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">


                  {/* Grid/Map View Toggle */}
                  <div className="flex items-center bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-1 rounded-2xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      aria-label="Switch to list view"
                      aria-pressed={viewMode === 'grid'}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-500 ${viewMode === 'grid' ? 'bg-zinc-800 text-sky-400 shadow-xl border border-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Icon name="Squares2X2Icon" size={16} />
                      <span className="text-[10px] font-black uppercase tracking-[0.05em]">List</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      aria-label="Switch to map view"
                      aria-pressed={viewMode === 'map'}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-500 ${viewMode === 'map' ? 'bg-zinc-800 text-sky-400 shadow-xl border border-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Icon name="MapIcon" size={16} />
                      <span className="text-[10px] font-black uppercase tracking-[0.05em]">Map</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced View Switcher */}
              {viewMode === 'grid' ? (
                <div className="space-y-12">
                  {(() => {
                    const groups: Record<string, typeof filteredProperties> = {};
                    filteredProperties.forEach((p) => {
                      const city = p.location?.split(',')[0]?.trim() || 'Other';
                      if (!groups[city]) groups[city] = [];
                      groups[city].push(p);
                    });

                    const cityEntries = Object.entries(groups).sort(([cityA, propsA], [cityB, propsB]) => {
                      const aIsUser = userCity && cityA.toLowerCase().includes(userCity.toLowerCase());
                      const bIsUser = userCity && cityB.toLowerCase().includes(userCity.toLowerCase());
                      if (aIsUser && !bIsUser) return -1;
                      if (!aIsUser && bIsUser) return 1;
                      return propsB.length - propsA.length;
                    });

                    if (cityEntries.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                          <div className="w-24 h-24 bg-zinc-900/50 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/5 shadow-2xl">
                            <Icon name="MagnifyingGlassIcon" size={40} className="text-zinc-700" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">No properties match</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto font-medium">We couldn't find any stays that match your search. Try refining your filters or exploring new destinations.</p>
                          </div>
                          <button
                            onClick={() => setSelectedStayType('all')}
                            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform"
                          >
                            Reset Filters
                          </button>
                        </div>
                      );
                    }

                    return cityEntries.map(([city, props], cityIdx) => (
                      <div key={city} className="space-y-10 group/city">
                        {/* Elegant City Header */}
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <h3 className="font-heading text-3xl font-black text-white tracking-tight">{city}</h3>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-[2px] bg-sky-500" />
                              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{props.length} Available Stays</span>
                            </div>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                        </div>

                        {/* Premium Responsive Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 pb-4">
                          {props.map((property, idx) => (
                            <motion.div
                              key={property.id}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.5, delay: idx * 0.1 }}
                            >
                              <PropertyCard
                                property={property}
                                onSaveProperty={handleToggleSaveProperty}
                                isSaved={savedProperties.includes(property.id)}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div key="main-map-view-container" className="map-square-container w-full rounded-[2rem] md:rounded-[3rem] overflow-visible border border-white/5 shadow-3xl relative">
                  <InteractiveMap
                    key="homepage-map-instance"
                    properties={filteredProperties.map((p) => ({
                      id: p.id,
                      title: p.title,
                      price: p.price,
                      available: true,
                      location: p.location,
                      image:
                        p.images && p.images.length > 0
                          ? p.images[0].url
                          : '/assets/images/no_image.png',
                    }))}
                    onPropertySelect={(id) => router.push(`/property-listing/${id}`)}
                  />


                </div>
              )}
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <PopularDestinations
              allProperties={allProperties}
              savedProperties={savedProperties}
              onSaveProperty={handleToggleSaveProperty}
            />
          </AnimatedSection>



          <AnimatedSection>
            <BecomeHostCTA />
          </AnimatedSection>

          <AnimatedSection>
            <TrustIndicators />
          </AnimatedSection>

          <AnimatedSection>
            <NewsletterSection />
          </AnimatedSection>
        </div>
      </main>

      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};

export default HomepageInteractive;
