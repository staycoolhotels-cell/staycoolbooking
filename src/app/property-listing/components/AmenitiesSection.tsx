import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Amenity {
  id: number;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

interface AmenitiesSectionProps {
  amenities: Amenity[];
  roomTypeAmenities?: Record<string, number[]>;
  roomTypeCounts?: Record<string, number>;
}

const AmenitiesSection = ({ amenities, roomTypeAmenities, roomTypeCounts }: AmenitiesSectionProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Group amenities by room type if data is available
  const hasRoomTypeAmenities = roomTypeAmenities && Object.keys(roomTypeAmenities).length > 0;
  
  const groupedAmenities: Record<string, Amenity[]> = {};
  let globalAmenities: Amenity[] = [];

  if (hasRoomTypeAmenities) {
    // 1. Map amenities by ID for easy lookup
    const amenityMap = new Map<number, Amenity>();
    amenities.forEach(a => amenityMap.set(a.id, a));

    // 2. Identify global amenities (those not assigned to any specific room type)
    const assignedIds = new Set<number>();
    Object.values(roomTypeAmenities).forEach(ids => {
        ids.forEach(id => assignedIds.add(id));
    });
    globalAmenities = amenities.filter(a => !assignedIds.has(a.id));

    // 3. Group the rest by room type
    Object.entries(roomTypeAmenities).forEach(([roomType, ids]) => {
      const validAmenities = ids
        .map(id => amenityMap.get(id))
        .filter((a): a is Amenity => a !== undefined);
      
      if (validAmenities.length > 0) {
        groupedAmenities[roomType] = validAmenities;
      }
    });
  } else {
    // Fallback: treat all amenities as global if no grouping data
    globalAmenities = amenities;
  }

  const renderAmenityGrid = (amenityList: Amenity[], title?: string) => {
    const sectionKey = title || 'Property';
    const isExpanded = !!expandedSections[sectionKey];

    const available = amenityList.filter((a) => a.available);
    const unavailable = amenityList.filter((a) => !a.available);

    return (
      <div className="mb-4 last:mb-0">
        <button 
            onClick={() => toggleSection(sectionKey)}
            className="w-full flex items-center justify-between text-left p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-colors group"
        >
            <div className="flex items-center gap-3 text-sm font-bold text-sky-400 uppercase tracking-widest">
                <Icon name={title === 'Shared' ? 'SparklesIcon' : title ? 'Bed' : 'Squares2X2Icon'} size={18} />
                {title ? `${title} Amenities` : 'All Amenities'}
                <span className="text-xs text-white/30 ml-2 bg-white/5 px-2 py-0.5 rounded-full">{amenityList.length}</span>
            </div>
            <Icon 
                name="ChevronDownIcon" 
                size={18} 
                className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-sky-400' : ''}`} 
            />
        </button>
        
        {isExpanded && (
            <div className="animate-in fade-in slide-in-from-top-2 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-4">
                  {available.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="group/item flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-colors duration-300"
                    >
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-success/10 sm:bg-white/[0.05] rounded-full sm:rounded-xl flex items-center justify-center group-hover/item:bg-primary/20 transition-colors border border-success/20 sm:border-white/5 group-hover/item:border-primary/30">
                        <Icon name={amenity.icon} size={16} className="text-success sm:text-white/70 group-hover/item:text-primary transition-colors w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                        <h3 className="text-[11px] sm:text-sm font-medium text-white/80 group-hover/item:text-white transition-colors truncate">
                          {amenity.name}
                        </h3>
                        {amenity.description && (
                          <p className="hidden sm:block text-[10px] sm:text-xs text-zinc-400 mt-0.5 line-clamp-2">{amenity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {unavailable.length > 0 && (
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4 flex items-center gap-2">
                      <Icon name="NoSymbolIcon" size={14} />
                      <span>Not Available</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                      {unavailable.map((amenity) => (
                        <div
                          key={amenity.id}
                          className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3 p-3 bg-white/[0.01] rounded-xl opacity-50"
                        >
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/[0.03] rounded-lg">
                            <Icon name={amenity.icon} size={16} className="text-zinc-600 sm:!w-5 sm:!h-5" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                            <h3 className="text-[11px] sm:text-sm font-medium text-zinc-500 line-through truncate leading-tight">
                              {amenity.name}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 md:p-8 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Icon name="Squares2X2Icon" size={20} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Amenities & Facilities
        </h2>
      </div>

      {hasRoomTypeAmenities ? (
          <div className="space-y-2">
             {globalAmenities.length > 0 && renderAmenityGrid(globalAmenities, "Shared")}
             {Object.entries(groupedAmenities).map(([roomType, typeAmenities]) => (
                 <div key={roomType}>
                    {renderAmenityGrid(typeAmenities, roomType)}
                 </div>
             ))}
          </div>
      ) : (
          renderAmenityGrid(globalAmenities)
      )}
    </div>
  );
};

export default AmenitiesSection;
