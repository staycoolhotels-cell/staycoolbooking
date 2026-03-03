'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import UltraLuxuryHeroSection from './UltraLuxuryHeroSection';
import SearchBar from './SearchBar';
import StayTypeFilter from './StayTypeFilter';
import PopularDestinations from './PopularDestinations';
import PropertyCard from './PropertyCard';
import InteractiveMap from './InteractiveMap';
import FeaturedDestinations from './FeaturedDestinations';
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

  // NEW FEATURE: Price Toggle (Taxes & Fees)
  const [showTotalWithTax, setShowTotalWithTax] = useState(false);

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
    if (filters.location) {
      filtered = filtered.filter((p) =>
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.stayType !== 'all') {
      filtered = filtered.filter((p) => p.type.toLowerCase().includes(filters.stayType));
    }
    setFilteredProperties(filtered);
  };

  const handleToggleSaveProperty = async (propertyId: string) => {
    if (!currentUser) {
      alert("Please log in to save properties to your wishlist.");
      router.push('/auth');
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
            className="relative z-10 w-full max-w-sm bg-zinc-900 border border-zinc-700/60 rounded-3xl p-8 shadow-2xl text-center overflow-hidden"
          >
            {/* Glow bg */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-sky-500/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Pulsing Icon */}
            <div className="relative flex items-center justify-center mb-6">
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
      <div className="w-full -mt-[100px]">
        <UltraLuxuryHeroSection onSearch={(term) => handleSearch({ location: term })} />
      </div>

      {/* 2. MAIN CONTENT CONTAINER: Constrained to 1440px for professional desktop fit */}
      <main className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-12 flex flex-col items-center relative">
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
              {/* Header with View Toggle & Price Toggle */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
                <div>
                  <h2 className="font-heading text-4xl font-bold text-zinc-100 tracking-tight">
                    {selectedStayType === 'all'
                      ? 'Featured Collections'
                      : `Top Rated ${selectedStayType}s`}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <p className="font-sans text-lg text-zinc-400">
                      {filteredProperties.length} exclusive properties found
                    </p>
                    {userCity && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-full text-xs font-semibold text-sky-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8 8 0 10-16 0c0 3.63 1.556 6.326 3.5 8.327a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Showing results near {userCity}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-4">
                  {/* FEATURE: Price Display Toggle */}
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-full">
                    <span className="text-sm font-semibold text-zinc-300 whitespace-nowrap">
                      Display total with taxes
                    </span>
                    <button
                      onClick={() => setShowTotalWithTax(!showTotalWithTax)}
                      className={`w-11 h-6 rounded-full transition-all relative ${showTotalWithTax ? 'bg-sky-500' : 'bg-zinc-700'}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${showTotalWithTax ? 'left-6' : 'left-1'}`}
                      />
                    </button>
                  </div>

                  {/* Grid/Map View Toggle */}
                  <div className="flex items-center space-x-1 bg-zinc-900/50 border border-zinc-700/50 p-1 rounded-full shadow-inner">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-sky-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Icon name="Squares2X2Icon" size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`p-2.5 rounded-full transition-all ${viewMode === 'map' ? 'bg-zinc-800 text-sky-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      <Icon name="MapIcon" size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* View Switcher: Grid or Map */}
              {viewMode === 'grid' ? (
                <div className="space-y-14">
                  {(() => {
                    // Group properties by city (location field)
                    const groups: Record<string, typeof filteredProperties> = {};
                    filteredProperties.forEach((p) => {
                      // Normalize: take first part before comma if "City, State"
                      const city = p.location?.split(',')[0]?.trim() || 'Other';
                      if (!groups[city]) groups[city] = [];
                      groups[city].push(p);
                    });

                    // Sort: user's city first, then by property count
                    const cityEntries = Object.entries(groups).sort(([cityA, propsA], [cityB, propsB]) => {
                      const aIsUser = userCity && cityA.toLowerCase().includes(userCity.toLowerCase());
                      const bIsUser = userCity && cityB.toLowerCase().includes(userCity.toLowerCase());
                      if (aIsUser && !bIsUser) return -1;
                      if (!aIsUser && bIsUser) return 1;
                      return propsB.length - propsA.length;
                    });

                    if (cityEntries.length === 0) {
                      return (
                        <p className="text-zinc-500 text-center py-20">No properties found.</p>
                      );
                    }

                    return cityEntries.map(([city, props]) => (
                      <div key={city}>
                        {/* City Header */}
                        <div className="flex items-center gap-4 mb-5">
                          <div>
                            <h3 className="font-heading text-2xl font-bold text-zinc-100">{city}</h3>
                            <p className="text-sm text-zinc-500 mt-0.5">{props.length} {props.length === 1 ? 'property' : 'properties'}</p>
                          </div>
                          <div className="flex-1 h-px bg-zinc-800" />
                        </div>

                        {/* Horizontally scrollable row of cards */}
                        <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                          {props.map((property) => (
                            <div
                              key={property.id}
                              className="flex-shrink-0 w-[280px] sm:w-[calc(50%-10px)] lg:w-[calc(33.33%-14px)] xl:w-[calc(20%-16px)]"
                            >
                              <PropertyCard
                                property={
                                  showTotalWithTax ? { ...property, price: property.price * 1.18 } : property
                                }
                                onSaveProperty={handleToggleSaveProperty}
                                isSaved={savedProperties.includes(property.id)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="h-[700px] w-full rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl relative">
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
                </div>
              )}
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <PopularDestinations
              allProperties={allProperties}
              savedProperties={savedProperties}
              onSaveProperty={handleToggleSaveProperty}
              showTotalWithTax={showTotalWithTax}
            />
          </AnimatedSection>

          <AnimatedSection>
            <FeaturedDestinations
              destinations={[
                {
                  id: 1,
                  name: 'Goa',
                  state: 'India',
                  propertyCount: 342,
                  image: 'https://images.unsplash.com/photo-1723459640576-560af9d58f55',
                  alt: 'Goa',
                  avgPrice: 4500,
                  popular: true,
                },
                {
                  id: 2,
                  name: 'Manali',
                  state: 'Himachal',
                  propertyCount: 289,
                  image: 'https://images.unsplash.com/photo-1609674915324-2b3b259a6d67',
                  alt: 'Manali',
                  avgPrice: 3800,
                  popular: true,
                },
                {
                  id: 3,
                  name: 'Coorg',
                  state: 'Karnataka',
                  propertyCount: 150,
                  image: 'https://images.unsplash.com/photo-1605380525508-30588641a9e7',
                  alt: 'Coorg',
                  avgPrice: 3500,
                  popular: false,
                },
                {
                  id: 4,
                  name: 'Jaipur',
                  state: 'Rajasthan',
                  propertyCount: 400,
                  image: 'https://images.unsplash.com/photo-1550596334-7ad92994e43e',
                  alt: 'Jaipur',
                  avgPrice: 5000,
                  popular: true,
                },
              ]}
              onDestinationClick={(d) => console.log(d)}
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
