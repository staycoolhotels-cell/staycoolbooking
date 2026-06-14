import React from 'react';
import { motion, Variants } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

interface PropertyDescriptionProps {
  description: string;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  area: number;
  totalRooms: number;
  highlights: string[];
  checkInTime?: string;
  checkOutTime?: string;
  roomTypeCounts?: Record<string, number>;
}

const PropertyDescription = ({
  description,
  propertyType,
  maxGuests,
  bedrooms,
  beds,
  bathrooms,
  area,
  totalRooms,
  highlights,
  checkInTime,
  checkOutTime,
  roomTypeCounts = {},
}: PropertyDescriptionProps) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  // Icon map for known room type keywords
  const getRoomTypeIcon = (type: string): string => {
    const t = type.toLowerCase();
    if (/\bac\b/.test(t) || t.includes('air conditioning') || t.includes('air-conditioning')) return 'Snowflake';
    if (t.includes('single')) return 'UserIcon';
    if (t.includes('double')) return 'UsersIcon';
    if (t.includes('twin')) return 'BedDouble';
    if (t.includes('suite')) return 'Sofa';
    if (t.includes('deluxe') || t.includes('delux') || t.includes('luxury')) return 'Crown';
    if (t.includes('dorm') || t.includes('bed')) return 'Bed';
    if (t.includes('cottage')) return 'HomeIcon';
    if (t.includes('private')) return 'LockClosedIcon';
    if (t.includes('shared')) return 'UserGroupIcon';
    if (t.includes('entire') || t.includes('villa') || t.includes('apartment')) return 'BuildingOfficeIcon';
    if (t.includes('standard')) return 'Bed';
    return 'BuildingStorefrontIcon';
  };

  const baseFeatures = [
    { icon: 'BuildingOfficeIcon', label: 'Total Units', value: totalRooms },
    { icon: 'HomeIcon', label: 'Bedrooms', value: bedrooms },
    { icon: 'Bed', label: 'Beds', value: beds },
    { icon: 'Bath', label: 'Bathrooms', value: bathrooms },
    { icon: 'Square3Stack3DIcon', label: 'Area', value: `${area} sq ft` },
    { icon: 'UserGroupIcon', label: 'Guests/per unit', value: maxGuests },
  ];

  // Dynamically create a card for every room type that has count > 0
  const roomTypeFeatures = Object.entries(roomTypeCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      icon: getRoomTypeIcon(type),
      label: type,
      value: count,
    }));

  const checkTimings = [
    { icon: 'ArrowRightEndOnRectangleIcon', label: 'Check-in', value: checkInTime || '12:00 PM' },
    { icon: 'ArrowLeftStartOnRectangleIcon', label: 'Check-out', value: checkOutTime || '11:00 AM' },
  ];

  const features = [...baseFeatures, ...roomTypeFeatures, ...checkTimings];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 md:p-8 relative overflow-hidden"
    >
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Icon name="InformationCircleIcon" size={20} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          About This {propertyType === 'Hostel' ? 'Dormitory' : propertyType}
        </h2>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-2 md:gap-3 mb-10">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="group flex flex-col items-center justify-center p-1 sm:p-1.5 md:p-2 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl hover:bg-white/[0.05] hover:border-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 min-h-[90px] sm:min-h-[120px] min-w-[72px] sm:min-w-[90px] flex-1 basis-[72px] sm:basis-[90px] max-w-[130px]"
          >
            <div className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 border border-white/5 group-hover:border-primary/30">
              <Icon name={feature.icon as string} size={24} className="text-white/60 group-hover:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-center w-full overflow-hidden">
              <p className="text-[7px] sm:text-[8px] md:text-[9px] font-medium text-white/40 tracking-tight uppercase leading-tight px-0.5 break-words line-clamp-2">{feature.label}</p>
              <p className="text-[10px] sm:text-xs md:text-sm font-bold text-white mt-0.5 sm:mt-1 px-0.5 truncate leading-tight">{feature.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="mb-10 group">
        <h3 className="text-sm font-semibold tracking-widest text-white/40 uppercase mb-4 flex items-center gap-2">
          <Icon name="DocumentTextIcon" size={16} />
          <span>Description</span>
          <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1 ml-2 transition-all duration-500 group-hover:from-white/20" />
        </h3>
        <p className="text-base text-white/70 leading-relaxed whitespace-pre-line font-light">
          {description}
        </p>
      </motion.div>

      {highlights && highlights.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-semibold tracking-widest text-white/40 uppercase mb-4 flex items-center gap-2">
            <Icon name="StarIcon" size={16} />
            <span>Highlights</span>
            <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1 ml-2 transition-all duration-500 group-hover:from-white/20" />
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-colors duration-300"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-success/20 flex items-center justify-center border border-success/30 flex-shrink-0">
                  <Icon
                    name="CheckIcon"
                    size={16}
                    className="text-success w-3 h-3 sm:w-4 sm:h-4"
                  />
                </div>
                <span className="text-[11px] sm:text-sm font-medium text-white/80 leading-tight">{highlight}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PropertyDescription;

