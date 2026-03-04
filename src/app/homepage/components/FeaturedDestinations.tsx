import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import TiltCard from '@/components/ui/TiltCard';

interface Destination {
  id: number;
  name: string;
  state: string;
  propertyCount: number;
  image: string;
  alt: string;
  avgPrice: number;
  popular: boolean;
}

interface FeaturedDestinationsProps {
  destinations: Destination[];
  onDestinationClick: (destination: string) => void;
}

const FeaturedDestinations = ({ destinations, onDestinationClick }: FeaturedDestinationsProps) => {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-zinc-100 tracking-tight">
              Popular Destinations
            </h2>
            <p className="font-sans mt-2 text-lg text-zinc-400">
              Explore unique stays in trending locations
            </p>
          </div>
          <Link
            href="/property-listing"
            className="font-sans flex items-center space-x-2 px-4 py-2 border border-transparent rounded-lg text-sky-400 hover:bg-zinc-800 transition-colors duration-200"
          >
            <span className="font-semibold text-sky-400">View All</span>
            <Icon name="ArrowRightIcon" size={20} className="text-sky-400" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination) => (
            <div
              key={destination.id}
              onClick={() => onDestinationClick(destination.name)}
              className="cursor-pointer"
            >
              <TiltCard tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.05} glareMaxOpacity={0.3} className="h-full">
                <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <AppImage
                    src={destination.image}
                    alt={destination.alt}
                    className="w-full h-64 group-hover:scale-105 transition-transform duration-500"
                    fill={true}
                    objectFit="cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-heading text-xl font-bold">{destination.name}</h3>
                    <p className="font-sans mt-1 text-white/80 text-sm">
                      {destination.propertyCount} properties
                    </p>
                  </div>
                  {destination.popular && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-sky-500 text-white text-xs font-bold rounded-full flex items-center">
                      <Icon name="FireIcon" size={14} className="mr-1" />
                      Popular
                    </div>
                  )}
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestinations;
