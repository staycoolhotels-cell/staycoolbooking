'use client';

import React from 'react';
import PropertyGallery from './PropertyGallery';
import PropertyHeader from './PropertyHeader';
import PropertyDescription from './PropertyDescription';
import AmenitiesSection from './AmenitiesSection';
import ReviewsSection from './ReviewsSection';
import BookingCard from './BookingCard';
import HostProfile from './HostProfile';
import LocationMap from './LocationMap';
import SafetySection from './SafetySection';

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
  safetyFeatures: SafetyFeature[];
  insuranceCoverage: string;
  emergencyContact: string;
}

interface PropertyListingInteractiveProps {
  propertyData: PropertyData;
}

const PropertyListingInteractive = ({ propertyData }: PropertyListingInteractiveProps) => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <PropertyHeader
              name={propertyData.name}
              type={propertyData.type}
              location={propertyData.location}
              rating={propertyData.rating}
              reviewCount={propertyData.reviewCount}
              isVerified={propertyData.isVerified}
              totalBookings={propertyData.totalBookings}
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
              />

              <LocationMap
                latitude={propertyData.location_details.latitude}
                longitude={propertyData.location_details.longitude}
                locationName={propertyData.location_details.locationName}
                address={propertyData.location_details.address}
                nearbyAttractions={propertyData.location_details.nearbyAttractions}
              />

              <SafetySection
                safetyFeatures={propertyData.safetyFeatures}
                insuranceCoverage={propertyData.insuranceCoverage}
                emergencyContact={propertyData.emergencyContact}
              />
            </div>

            <div className="lg:col-span-1">
              <BookingCard
                pricePerNight={propertyData.pricePerNight}
                currency={propertyData.currency}
                isAvailable={propertyData.isAvailable}
                hostResponseRate={propertyData.hostResponseRate}
                hostResponseTime={propertyData.hostResponseTime}
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyListingInteractive;
