import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

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
  onPropertyClick: (id: string) => void;
  onSaveProperty: (id: string) => void;
  isSaved: boolean;
}

const PropertyCard = ({
  property,
  onPropertyClick,
  onSaveProperty,
  isSaved,
}: PropertyCardProps) => {
  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-1">
      <div className="relative w-full overflow-hidden aspect-video">
        <Swiper
          modules={[Pagination, Navigation, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          className="w-full h-full"
          // Prevent property card click when interacting with swiper controls
          onClick={(swiper) => {
            if (swiper.clickedSlide) {
              onPropertyClick(property.id);
            }
          }}
        >
          {property.images.map((image, index) => (
            <SwiperSlide key={index}>
              <AppImage
                src={image.url}
                alt={image.alt}
                className="w-full h-full"
                fill={true}
                objectFit="cover"
              />
            </SwiperSlide>
          ))}
          {/* Custom Navigation Arrows */}
          <div className="swiper-button-prev !text-foreground !w-8 !h-8 !-left-2 group-hover:!left-2 transition-all duration-300 transform -translate-y-1/2"></div>
          <div className="swiper-button-next !text-foreground !w-8 !h-8 !-right-2 group-hover:!right-2 transition-all duration-300 transform -translate-y-1/2"></div>
        </Swiper>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSaveProperty(property.id);
          }}
          className="absolute top-4 right-4 p-2 bg-surface/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-surface transition-colors duration-200 shadow-md z-10"
        >
          <Icon
            name="HeartIcon"
            size={20}
            variant={isSaved ? 'solid' : 'outline'}
            className={isSaved ? 'text-destructive' : 'text-text-secondary'}
          />
        </button>
        {property.host.verified && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-br from-gradient-primary-from/80 to-gradient-primary-to/80 text-primary-foreground text-xs font-semibold rounded-full flex items-center z-10">
            <Icon name="CheckBadgeIcon" size={14} className="mr-1" />
            Verified
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between">
          <h3 className="font-heading text-md font-bold text-text-primary pr-2 leading-tight">
            {property.title}
          </h3>
          <div className="flex-shrink-0 flex items-center space-x-1 text-accent">
            <Icon name="StarIcon" size={16} variant="solid" />
            <span className="font-montserrat text-text-primary text-xs font-medium">
              {property.rating}
            </span>
          </div>
        </div>
        <p className="font-montserrat text-text-secondary text-xs mt-1 truncate">
          {property.location}
        </p>
        <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
          <div>
            <span className="font-montserrat text-lg font-bold text-primary">
              ₹{property.price.toLocaleString('en-IN')}
            </span>
            <span className="font-montserrat text-text-secondary text-xs ml-1">/ night</span>
          </div>
          <span className="font-montserrat text-text-secondary text-xs">
            {property.reviews} reviews
          </span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
