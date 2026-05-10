'use client';

import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const isGuestFavourite = property.rating >= 4.8;
  const router = useRouter();

  return (
    <motion.div
      id={`property-${property.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={() => router.push(`/property-listing/${property.id}`)}
      className="group flex flex-col gap-2 w-full cursor-pointer relative p-2 sm:p-2.5 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-[1.25rem] hover:bg-zinc-800/60 hover:border-sky-500/30 transition-all duration-500 shadow-2xl overflow-hidden"
    >
      {/* Decorative Glow Effect on Hover */}
      <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] bg-sky-500/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

      {/* IMAGE SECTION */}
      <div className="relative aspect-square w-full rounded-lg sm:rounded-[1.5rem] overflow-hidden bg-zinc-800 shadow-inner">
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
        >
          {property.images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-full">
                <AppImage
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  fill={true}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
              </div>
            </SwiperSlide>
          ))}

          {/* Custom Navigation Arrows */}
          <div
            className={`swiper-button-next-${property.id} absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-lg hover:bg-sky-500/80 hover:scale-110 active:scale-95`}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            role="button"
            aria-label="Next image"
          >
            <Icon name="ChevronRightIcon" size={14} className="text-white" />
          </div>
          <div
            className={`swiper-button-prev-${property.id} absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer shadow-lg hover:bg-sky-500/80 hover:scale-110 active:scale-95`}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            role="button"
            aria-label="Previous image"
          >
            <Icon name="ChevronLeftIcon" size={14} className="text-white" />
          </div>
        </Swiper>

        {/* Badges Overlay */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1 sm:gap-2">
            {isGuestFavourite && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-sky-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg border border-sky-400/50"
              >
                <span className="text-[6px] sm:text-[9px] font-black uppercase tracking-wider text-white flex items-center gap-1 whitespace-nowrap">
                  <Icon name="StarIcon" size={8} variant="solid" className="text-white/90" />
                  Guest Favourite
                </span>
              </motion.div>
            )}
            <div className="bg-black/40 backdrop-blur-md px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-white/10 text-[6px] sm:text-[10px] font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 shadow-lg whitespace-nowrap">
              <Icon name="MapPinIcon" size={8} className="text-sky-400" />
              {property.location.split(',')[0]}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSaveProperty(property.id);
            }}
            aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={isSaved}
            className="pointer-events-auto p-1.5 sm:p-2.5 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-110 active:scale-90 group/heart"
          >
            <Icon
              name="HeartIcon"
              size={18}
              variant={isSaved ? 'solid' : 'outline'}
              className={cn(
                "transition-all duration-300",
                isSaved ? 'text-rose-500 scale-110 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'text-white/80 group-hover/heart:text-rose-400'
              )}
            />
          </button>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex flex-col gap-2 sm:gap-3 relative z-10 px-0.5 sm:px-1 pb-1 sm:pb-2">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-0.5 max-w-[70%]">
            <h3 className="font-heading text-xs sm:text-sm font-bold text-white leading-tight tracking-tight group-hover:text-sky-400 transition-colors duration-300 truncate">
              {property.title}
            </h3>
            {property.type && (
              <p className="text-sky-400 text-[7px] sm:text-[9px] font-black uppercase tracking-[0.1em] -mt-0.5">
                {property.type}
              </p>
            )}
            <div className="flex items-center gap-1">
              <Icon name="MapPinIcon" size={10} className="text-sky-400/80" />
              <p className="text-zinc-400 text-[8px] sm:text-[10px] font-medium truncate">
                {property.location}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-800/80 px-1 sm:px-1.5 py-0.5 rounded-md border border-white/5">
              <Icon name="StarIcon" size={8} variant="solid" className="text-yellow-500" />
              <span className="text-white text-[8px] sm:text-[10px] font-bold">
                {property.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-lg font-black text-white tracking-tighter">
                ₹{property.price.toLocaleString('en-IN')}
              </span>
              <span className="text-zinc-500 text-[8px] sm:text-[9px] font-medium">/ night</span>
            </div>
            <p className="text-[7px] sm:text-[8px] text-zinc-500 font-medium line-clamp-1">Excl. taxes</p>
          </div>

          <motion.div
            whileHover={{ x: 5 }}
            className="flex items-center gap-1 sm:gap-2 group-hover:text-sky-400 text-zinc-400 transition-colors"
          >
            <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest">Explore</span>
            <Icon name="ArrowRightIcon" size={12} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
