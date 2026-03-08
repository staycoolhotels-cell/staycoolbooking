import React from 'react';
import { motion, Variants } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

interface PropertyDescriptionProps {
  description: string;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  highlights: string[];
}

const PropertyDescription = ({
  description,
  propertyType,
  maxGuests,
  bedrooms,
  bathrooms,
  area,
  highlights,
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

  const features = [
    { icon: 'UserGroupIcon', label: 'Guests', value: maxGuests },
    { icon: 'HomeIcon', label: 'Bedrooms', value: bedrooms },
    { icon: 'SparklesIcon', label: 'Bathrooms', value: bathrooms },
    { icon: 'Square3Stack3DIcon', label: 'Area', value: `${area} sq ft` },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden"
    >
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Icon name="InformationCircleIcon" size={20} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          About This {propertyType}
        </h2>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="group flex flex-col items-center justify-center space-y-2 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 border border-white/5 group-hover:border-primary/30">
              <Icon name={feature.icon as string} size={24} className="text-white/60 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/40 tracking-wide uppercase">{feature.label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{feature.value}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-colors duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center border border-success/30 flex-shrink-0">
                  <Icon
                    name="CheckIcon"
                    size={16}
                    className="text-success"
                  />
                </div>
                <span className="text-sm font-medium text-white/80">{highlight}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PropertyDescription;
