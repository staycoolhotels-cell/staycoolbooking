'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PropertyApprovalCardProps {
  property: Property;
  onReview: (id: string, action: 'active' | 'rejected') => void;
}

const PropertyApprovalCard = ({ property, onReview }: PropertyApprovalCardProps) => {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const displayImages = property.images && property.images.length > 0
    ? property.images
    : property.image_url ? [property.image_url] : [];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const currentImageUrl = displayImages[currentImageIndex] 
    ? (typeof displayImages[currentImageIndex] === 'string' ? displayImages[currentImageIndex] : (displayImages[currentImageIndex] as any).url)
    : null;

  return (
    <div
      onClick={() => router.push(`/admin-panel/property-management/${property.id}`)}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700 transition-all cursor-pointer group"
    >
      <div suppressHydrationWarning className="relative h-48 w-full bg-zinc-800">
        {currentImageUrl ? (
          <>
            <img
              src={currentImageUrl}
              alt={property.title || 'Property'}
              className="w-full h-full object-cover"
            />
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-[10px] font-mono text-white border border-white/10">
                  {currentImageIndex + 1}/{displayImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Icon name="PhotoIcon" size={32} />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${property.status?.toLowerCase() === 'pending' ? 'bg-yellow-500/90 text-black' : 'bg-zinc-500/90 text-white'
            }`}>
            {property.status}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-bold text-lg text-white line-clamp-1">{property.title || property.name}</h3>
          <span className="text-zinc-400 text-xs font-mono">{property.tier}</span>
        </div>

        <div className="space-y-2 mb-6 flex-1">
          <div className="flex items-center text-zinc-400 text-sm">
            <Icon name="MapPinIcon" size={14} className="mr-2 text-zinc-500" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          <div className="flex items-center text-zinc-400 text-sm">
            <Icon name="CurrencyRupeeIcon" size={14} className="mr-2 text-zinc-500" />
            <span>₹{property.price_per_night} / night</span>
          </div>
          {/* Links to docs could go here */}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onReview(property.id, 'rejected'); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <Icon name="XMarkIcon" size={16} />
            Reject
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReview(property.id, 'active'); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg text-sm font-bold hover:bg-green-500/20 transition-colors border border-green-500/20"
          >
            <Icon name="CheckIcon" size={16} />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyApprovalCard;
