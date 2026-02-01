import React from 'react';
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
  return (
    <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">About This Property</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
          <Icon name="UserGroupIcon" size={24} className="text-primary" />
          <div>
            <p className="text-sm text-text-secondary">Guests</p>
            <p className="text-lg font-heading font-bold text-foreground">{maxGuests}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
          <Icon name="HomeIcon" size={24} className="text-primary" />
          <div>
            <p className="text-sm text-text-secondary">Bedrooms</p>
            <p className="text-lg font-heading font-bold text-foreground">{bedrooms}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
          <Icon name="SparklesIcon" size={24} className="text-primary" />
          <div>
            <p className="text-sm text-text-secondary">Bathrooms</p>
            <p className="text-lg font-heading font-bold text-foreground">{bathrooms}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
          <Icon name="Square3Stack3DIcon" size={24} className="text-primary" />
          <div>
            <p className="text-sm text-text-secondary">Area</p>
            <p className="text-lg font-heading font-bold text-foreground">{area} sq ft</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-3">Property Type</h3>
        <p className="text-base text-foreground">{propertyType}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-3">Description</h3>
        <p className="text-base text-foreground leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>

      <div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
          Property Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {highlights.map((highlight, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Icon
                name="CheckCircleIcon"
                size={20}
                className="text-success flex-shrink-0"
                variant="solid"
              />
              <span className="text-sm text-foreground">{highlight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyDescription;
