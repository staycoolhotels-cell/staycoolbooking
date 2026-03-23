'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import UltraLuxuryHeroSection from './UltraLuxuryHeroSection';
import SearchBar from './SearchBar';
import StayTypeFilter from './StayTypeFilter';
import PopularDestinations from './PopularDestinations';
import PropertyCard from './PropertyCard';
import InteractiveMap from './InteractiveMap';

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

// Animation wrapper for sections
interface AnimatedSectionProps {
  children: React.ReactNode;
}

const AnimatedSection = ({ children }: AnimatedSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotateX: 30 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      style={{ perspective: 1000 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

interface PropertyFromDB {
  id: string;
  name: string;
  location: string;
  tier: string;
  status: string;
  host_id: string;
  created_at: string;
  price_per_night: number;
  image_url?: string;
  images?: { url: string; alt: string }[];
  title: string;
  description: string;
  // Add other properties from your database schema here
}

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

const mapPropertyForCard = (property: PropertyFromDB): PropertyForCard => {
  let displayImages: { url: string; alt: string }[] = [];

  if (property.images && property.images.length > 0) {
    displayImages = property.images;
  } else if (property.image_url) {
    displayImages = [{ url: property.image_url, alt: property.title || property.name }];
  } else {
    displayImages = [{ url: '/assets/images/no_image.png', alt: 'No Image' }];
  }

  return {
    id: property.id,
    title: property.title || property.name,
    location: property.location,
    type: property.tier,
    price: property.price_per_night,
    rating: parseFloat((Math.random() * (5.0 - 4.0) + 4.0).toFixed(2)), // Random rating 4.0-5.0
    reviews: Math.floor(Math.random() * 200) + 10, // Random reviews
    images: displayImages,
    amenities: [], // Placeholder
    instantBook: true, // Placeholder
    host: { verified: true }, // Placeholder
  };
};

interface HomepageInteractiveProps {
  initialProperties: PropertyFromDB[];
}

const HomepageInteractive: React.FC<HomepageInteractiveProps> = ({ initialProperties }) => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedStayType, setSelectedStayType] = useState('all');
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allProperties, setAllProperties] = useState<PropertyForCard[]>(
    initialProperties.map(mapPropertyForCard)
  );
  const [filteredProperties, setFilteredProperties] = useState<PropertyForCard[]>(
    initialProperties.map(mapPropertyForCard)
  );
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');



  // Location-based sorting
  const [userCity, setUserCity] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [showLocationBanner, setShowLocationBanner] = useState(true);

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
    };

    allProperties.forEach((p) => {
      const type = p.type.toLowerCase();
      if (type.includes('hotel')) calc.hotel++;
      else if (type.includes('homestay') || type.includes('home')) calc.homestay++;
      else if (type.includes('tent') || type.includes('camp')) calc.tent++;
      else if (type.includes('wooden') || type.includes('cabin')) calc.wooden++;
      else if (type.includes('dorm') || type.includes('hostel')) calc.dormitory++;
      else if (type.includes('apartment') || type.includes('flat')) calc.apartment++;
      else if (type.includes('resort') || type.includes('villa')) calc.resort++; // Include villa in resort or separate if needed
    });

    return calc;
  }, [allProperties]);

  const stayTypes = [
    { id: 'all', name: 'All Stays', icon: 'HomeIcon', count: counts.all },
    { id: 'hotel', name: 'Hotel Rooms', icon: 'BuildingOffice2Icon', count: counts.hotel },
    { id: 'homestay', name: 'Home Stays', icon: 'HomeIcon', count: counts.homestay },
    { id: 'tent', name: 'Tents', icon: 'TentIcon', count: counts.tent },
    { id: 'wooden', name: 'Wooden Stays', icon: 'HomeModernIcon', count: counts.wooden },
    { id: 'dormitory', name: 'Dormitory Stays', icon: 'UserGroupIcon', count: counts.dormitory },
    { id: 'apartment', name: 'Apartment Stays', icon: 'BuildingLibraryIcon', count: counts.apartment },
    { id: 'resort', name: 'Resorts', icon: 'ResortIcon', count: counts.resort },
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
          const data = await res.json();
          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.county ||
            null;
          if (city) setUserCity(city);
          setLocationStatus('granted');
        } catch {
          setLocationStatus('denied');
        }
      },
      () => setLocationStatus('denied'),
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    setIsHydrated(true);

    // Fetch user and their wishlist
    const fetchUserAndWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);

        const { data: wishlistData, error, status } = await supabase
          .from('wishlist')
          .select('property_id')
          .eq('user_id', user.id);

        if (error) {
          console.error("Wishlist Fetch Error:", error, status);
        } else {
          console.log("Fetched wishlist items on load:", wishlistData);
        }

        if (wishlistData) {
          setSavedProperties(wishlistData.map((w: any) => w.property_id));
        }
      }
    };

    fetchUserAndWishlist();
  }, []);

  useEffect(() => {
    setFilteredProperties(allProperties);
  }, [allProperties]);

  useEffect(() => {
    if (selectedStayType === 'all') {
      setFilteredProperties(allProperties);
    } else {
      const filtered = allProperties.filter((p) =>
        p.type.toLowerCase().includes(selectedStayType.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [selectedStayType, allProperties]);

  const handleSearch = (filters: any) => {
    let filtered = allProperties;

    // Determine location and dates from filters object or direct parameters
    const locationStr = typeof filters === 'string' ? filters : (filters?.location || '');
    const dates = filters?.dates;

    if (locationStr && typeof locationStr === 'string') {
      filtered = filtered.filter((p) =>
        p.location.toLowerCase().includes(locationStr.toLowerCase())
      );
    }

    if (filters?.stayType && filters.stayType !== 'all') {
      filtered = filtered.filter((p) => p.type.toLowerCase().includes(filters.stayType));
    }

    if (dates) {
      console.log('Searching for dates:', dates);
      // Backend filtering for dates could be added here
    }

    setFilteredProperties(filtered);
  };

  const handleToggleSaveProperty = async (propertyId: string) => {
    if (!currentUser) {
      alert("Please log in to save properties to your wishlist.");
      router.replace('/auth');
      return;
    }

    const isCurrentlySaved = savedProperties.includes(propertyId);

    // Optimistic UI update
    setSavedProperties((prev) =>
      isCurrentlySaved ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );

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
          console.error("Error inserting to wishlist:", { message: error.message, details: error.details, hint: error.hint, code: error.code });
          throw error;
        }
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      // Revert optimistic update on error
      setSavedProperties((prev) =>
        isCurrentlySaved ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
      );
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
                onClick={() => setShowLocationBanner(false)}
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
              onTypeSelect={setSelectedStayType}
            />
          </AnimatedSection>

          <AnimatedSection>
            <div className="w-full">
              {/* Premium Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
                <div className="space-y-4 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">Curated Excellence</span>
                  </div>

                  <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[0.9]">
                    {selectedStayType === 'all'
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
                  <div className="flex items-center bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-500 ${viewMode === 'grid' ? 'bg-zinc-800 text-sky-400 shadow-xl border border-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Icon name="Squares2X2Icon" size={18} />
                      <span className="text-xs font-black uppercase tracking-[0.1em]">List</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all duration-500 ${viewMode === 'map' ? 'bg-zinc-800 text-sky-400 shadow-xl border border-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Icon name="MapIcon" size={18} />
                      <span className="text-xs font-black uppercase tracking-[0.1em]">Map</span>
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
                <div className="h-[750px] w-full rounded-[3rem] overflow-hidden border border-white/5 shadow-3xl relative">
                  <InteractiveMap
                    properties={filteredProperties.map((p) => ({
                      ...p,
                      id: p.id,
                      lat: parseFloat((Math.random() * (51.6 - 51.2) + 51.2).toFixed(3)),
                      lng: parseFloat((Math.random() * (0.2 - -0.4) + -0.4).toFixed(3)),
                      available: true,
                      image:
                        p.images && p.images.length > 0
                          ? p.images[0].url
                          : '/assets/images/no_image.png',
                    }))}
                    onPropertySelect={(id) => router.push(`/property-listing/${id}`)}
                  />

                  {/* Floating Legend or Info if needed */}
                  <div className="absolute bottom-10 left-10 z-10 px-6 py-4 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold">120+ users exploring</p>
                        <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">Live in {userCity || 'India'}</p>
                      </div>
                    </div>
                  </div>
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
