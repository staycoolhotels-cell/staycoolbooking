import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility, if not I'll stick to template literals or simple combos

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface PropertyCardProps {
  property: {
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
  };
  onSaveProperty: (id: string) => void;
  isSaved: boolean;
}

const PropertyCard = ({
  property,
  onSaveProperty,
  isSaved,
}: PropertyCardProps) => {
  // Logic for "Guest favourite": e.g., rating >= 4.8 and reviews > 5 (simplified)
  const isGuestFavourite = property.rating >= 4.8;

  return (
    <div className="group flex flex-col gap-3 w-full cursor-pointer relative p-3 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-[1.25rem] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 shadow-sm">
      <Link href={`/property-listing/${property.id}`} className="absolute inset-0 z-0" draggable={false} />

      {/* IMAGE SECTION */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-800">
        <Swiper
          modules={[Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={{
            nextEl: `.swiper-button-next-${property.id}`,
            prevEl: `.swiper-button-prev-${property.id}`,
          }}
          className="w-full h-full"
          onClick={(swiper, e) => {
            // swiper clicks shouldn't trigger link if interacting with controls
            // commonly handled by z-index or specific elements, 
            // but here the swiper is part of the card
          }}
        >
          {property.images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-full">
                <AppImage
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  fill={true}
                />
                {/* Dark gradient for text readability if needed, but per design usually clean */}
                <div className="absolute inset-0 bg-black/5" />
              </div>
            </SwiperSlide>
          ))}

          {/* Custom Navigation Arrows (Visible on Group Hover) */}
          <div
            className={`swiper-button-next-${property.id} absolute top-1/2 right-3 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-sm hover:scale-105 hover:bg-white`}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          >
            <Icon name="ChevronRightIcon" size={14} className="text-black" />
          </div>
          <div
            className={`swiper-button-prev-${property.id} absolute top-1/2 left-3 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-sm hover:scale-105 hover:bg-white`}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          >
            <Icon name="ChevronLeftIcon" size={14} className="text-black" />
          </div>
        </Swiper>

        {/* Guest Favourite Badge */}
        {isGuestFavourite && (
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-xs font-bold text-black flex items-center">
              Guest favourite
            </span>
          </div>
        )}

        {/* Wishlist Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSaveProperty(property.id);
          }}
          className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-black/10 transition-colors"
        >
          <Icon
            name="HeartIcon"
            size={24}
            variant={isSaved ? 'solid' : 'outline'}
            className={isSaved ? 'text-rose-500' : 'text-white/70 stroke-[2px] hover:scale-110 transition-transform'}
          />
        </button>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex flex-col gap-1 relative z-10 pointer-events-none px-1 pb-1"> {/* content shouldn't block link click */}
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-zinc-100 text-[15px] leading-tight truncate pr-2">
            {property.location}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Icon name="StarIcon" size={12} variant="solid" className="text-zinc-100" />
            <span className="text-zinc-100 text-[14px] font-light">
              {property.rating}
            </span>
          </div>
        </div>

        <p className="text-zinc-500 text-[14px] leading-tight font-light truncate">
          {property.type}
        </p>

        <p className="text-zinc-500 text-[14px] leading-tight font-light truncate">
          Details available on request
        </p>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-semibold text-zinc-100 text-[15px]">
            ₹{property.price.toLocaleString('en-IN')}
          </span>
          <span className="text-zinc-100 font-light text-[15px]">
            night
          </span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
