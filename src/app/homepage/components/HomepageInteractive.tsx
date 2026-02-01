'use client';

import React, { useState, useEffect, useMemo } from 'react';
import UltraLuxuryHeroSection from './UltraLuxuryHeroSection';
import SearchBar from './SearchBar';
import StayTypeFilter from './StayTypeFilter';
import PropertyCard from './PropertyCard';
import InteractiveMap from './InteractiveMap';
import FeaturedDestinations from './FeaturedDestinations';
import TrustIndicators from './TrustIndicators';
import NewsletterSection from './NewsletterSection';
import Footer from './Footer';
import Icon from '@/components/ui/AppIcon';
import useIntersectionObserver from './useIntersectionObserver';

// Animation wrapper for sections
interface AnimatedSectionProps {
  children: React.ReactNode;
}

const AnimatedSection = ({ children }: AnimatedSectionProps) => {
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 w-full ${isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {children}
    </div>
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
  image_url: string;
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

const mapPropertyForCard = (property: PropertyFromDB): PropertyForCard => ({
  id: property.id,
  title: property.title,
  location: property.location,
  type: property.tier,
  price: property.price_per_night,
  rating: 4.5, // Placeholder
  reviews: 0, // Placeholder
  images: [{ url: property.image_url, alt: property.title }],
  amenities: [], // Placeholder
  instantBook: true, // Placeholder
  host: { verified: true }, // Placeholder
});

interface HomepageInteractiveProps {
  initialProperties: PropertyFromDB[];
}

const HomepageInteractive: React.FC<HomepageInteractiveProps> = ({ initialProperties }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedStayType, setSelectedStayType] = useState('all');
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyForCard[]>(
    initialProperties.map(mapPropertyForCard)
  );
  const [filteredProperties, setFilteredProperties] = useState<PropertyForCard[]>(
    initialProperties.map(mapPropertyForCard)
  );
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // NEW FEATURE: Price Toggle (Taxes & Fees)
  const [showTotalWithTax, setShowTotalWithTax] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
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

  if (!isHydrated) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center overflow-x-hidden">
      {/* 1. HERO SECTION: Full-width for immersive feel */}
      <div className="w-full">
        <UltraLuxuryHeroSection />
      </div>

      {/* 2. MAIN CONTENT CONTAINER: Constrained to 1440px for professional desktop fit */}
      <main className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-12 flex flex-col items-center relative">
        {/* SEARCH BAR: Positioned to overlap Hero */}
        <div className="w-full max-w-5xl -mt-16 relative z-40">
          <SearchBar onSearch={handleSearch} />

          {/* FEATURE: Trending Tags */}
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
              Trending:
            </span>
            {['Villas in Goa', 'Manali Tents', 'Wooden Cottages', 'Coorg Stays'].map((tag) => (
              <button
                key={tag}
                className="text-xs text-white hover:text-primary transition-colors font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 3. LAYOUT SECTIONS */}
        <div className="w-full space-y-24 py-20">
          <AnimatedSection>
            <StayTypeFilter
              stayTypes={[
                { id: 'all', name: 'All Stays', icon: 'HomeIcon', count: 2847 },
                { id: 'tent', name: 'Tents', icon: 'BuildingOfficeIcon', count: 456 },
                { id: 'wooden', name: 'Wooden Stays', icon: 'HomeModernIcon', count: 623 },
                { id: 'boutique', name: 'Boutique', icon: 'SparklesIcon', count: 389 },
                { id: 'villa', name: 'Villas', icon: 'BuildingLibraryIcon', count: 512 },
              ]}
              selectedType={selectedStayType}
              onTypeSelect={setSelectedStayType}
            />
          </AnimatedSection>

          <AnimatedSection>
            <div className="w-full">
              {/* Header with View Toggle & Price Toggle */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
                <div>
                  <h2 className="font-heading text-4xl font-bold text-text-primary tracking-tight">
                    {selectedStayType === 'all'
                      ? 'Featured Collections'
                      : `Top Rated ${selectedStayType}s`}
                  </h2>
                  <p className="font-sans mt-2 text-lg text-text-secondary">
                    {filteredProperties.length} exclusive properties found
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-4">
                  {/* FEATURE: Price Display Toggle */}
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-muted/50 border border-border rounded-full">
                    <span className="text-sm font-semibold text-text-secondary whitespace-nowrap">
                      Display total with taxes
                    </span>
                    <button
                      onClick={() => setShowTotalWithTax(!showTotalWithTax)}
                      className={`w-11 h-6 rounded-full transition-all relative ${showTotalWithTax ? 'bg-primary' : 'bg-border'}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${showTotalWithTax ? 'left-6' : 'left-1'}`}
                      />
                    </button>
                  </div>

                  {/* Grid/Map View Toggle */}
                  <div className="flex items-center space-x-1 bg-muted p-1 rounded-full shadow-inner">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary'}`}
                    >
                      <Icon name="Squares2X2Icon" size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`p-2.5 rounded-full transition-all ${viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary'}`}
                    >
                      <Icon name="MapIcon" size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* View Switcher: Grid or Map */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={
                        showTotalWithTax ? { ...property, price: property.price * 1.18 } : property
                      }
                      onPropertyClick={() => (window.location.href = '/property-listing')}
                      onSaveProperty={(id) =>
                        setSavedProperties((prev) =>
                          prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
                        )
                      }
                      isSaved={savedProperties.includes(property.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-[700px] w-full rounded-[2.5rem] overflow-hidden border border-border shadow-2xl relative">
                  <InteractiveMap
                    properties={filteredProperties.map((p) => ({
                      ...p,
                      id: Number(p.id), // Convert string ID to number
                      lat: parseFloat((Math.random() * (51.6 - 51.2) + 51.2).toFixed(3)), // Placeholder latitude
                      lng: parseFloat((Math.random() * (0.2 - -0.4) + -0.4).toFixed(3)), // Placeholder longitude
                      available: true,
                      image:
                        p.images && p.images.length > 0
                          ? p.images[0].url
                          : '/assets/images/no_image.png',
                    }))}
                    onPropertySelect={() => (window.location.href = '/property-listing')}
                  />
                </div>
              )}
            </div>
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
