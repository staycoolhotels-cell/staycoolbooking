'use client';

import React from 'react';
import PropertyCard from '@/app/homepage/components/PropertyCard';
import Icon from '@/components/ui/AppIcon';

interface SharedWishlistClientProps {
  wishlistItems: any[];
}

export default function SharedWishlistClient({ wishlistItems }: SharedWishlistClientProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {wishlistItems.map((item) => {
        const prop = item.properties as any;
        let displayPrice = prop.price_per_night || prop.price || 0;
        if (prop.room_types && Array.isArray(prop.room_types) && prop.room_types.length > 0 && prop.room_type_prices) {
          const activePrices = prop.room_types
            .map((rt: string) => parseFloat(String(prop.room_type_prices[rt])) || 0)
            .filter((p: number) => p > 0);
          if (activePrices.length > 0) {
            displayPrice = Math.min(...activePrices);
          }
        }
        
        // Map DB fields to PropertyCard expectations
        const formattedProperty = {
          id: prop.id,
          title: prop.title || prop.name || 'Untitled Property',
          location: prop.location || prop.city || 'Unknown Location',
          type: prop.type || prop.tier || 'Stay',
          price: displayPrice,
          rating: prop.rating || 5.0,
          reviews: prop.reviews_count || 0,
          images: Array.isArray(prop.images) 
            ? prop.images.map((img: any) => 
                typeof img === 'string' ? { url: img, alt: prop.title || prop.name } : img
              )
            : [{ url: prop.image_url || '/placeholder.jpg', alt: prop.title || prop.name }],
          amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
          instantBook: !!prop.instant_book,
          host: {
            verified: !!prop.host_verified
          }
        };

        return (
          <div key={item.id} className="relative group">
            <PropertyCard 
              property={formattedProperty as any} 
              onSaveProperty={() => {}} 
              isSaved={true}
            />
            {item.notes && (
              <div className="mt-3 p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-500 italic flex gap-2">
                   <Icon name="ChatBubbleBottomCenterTextIcon" size={14} />
                   &ldquo;{item.notes}&rdquo;
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
