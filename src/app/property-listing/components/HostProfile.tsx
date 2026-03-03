import React, { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import ContactHostModal from '@/components/ui/ContactHostModal';

interface HostProfileProps {
  name: string;
  avatar: string;
  avatarAlt: string;
  joinedDate: string;
  isVerified: boolean;
  responseRate: number;
  responseTime: string;
  totalProperties: number;
  bio: string;
  coHostName?: string;
  hostId: string;
  propertyId: string;
}

const HostProfile = ({
  name,
  avatar,
  avatarAlt,
  joinedDate,
  isVerified,
  responseRate,
  responseTime,
  totalProperties,
  bio,
  coHostName,
  hostId,
  propertyId,
}: HostProfileProps) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">Meet Your Host</h2>

      <div className="flex items-start space-x-6">
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/20">
            <AppImage
              src={avatar}
              alt={avatarAlt}
              className="w-full h-full"
              fill={true}
              objectFit="cover"
            />
            {isVerified && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-success rounded-full flex items-center justify-center ring-4 ring-card">
                <Icon name="CheckIcon" size={16} className="text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-heading font-bold text-foreground">{name}</h3>
            {coHostName && (
              <p className="text-sm font-sans text-text-secondary mt-1">Co-Hosted by <span className="text-foreground font-semibold">{coHostName}</span></p>
            )}
            {isVerified && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-success/10 rounded-full">
                <Icon name="CheckBadgeIcon" size={16} className="text-success" variant="solid" />
                <span className="text-xs font-heading font-medium text-success">Verified Host</span>
              </div>
            )}
          </div>

          <p className="text-sm text-text-secondary mb-4">Joined {joinedDate}</p>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold text-foreground">{responseRate}%</p>
              <p className="text-xs text-text-secondary mt-1">Response Rate</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold text-foreground">{responseTime}</p>
              <p className="text-xs text-text-secondary mt-1">Response Time</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-heading font-bold text-foreground">{totalProperties}</p>
              <p className="text-xs text-text-secondary mt-1">Properties</p>
            </div>
          </div>

          <p className="text-sm text-foreground leading-relaxed mb-4">{bio}</p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg font-heading font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={20} />
            <span>Contact Host</span>
          </button>
        </div>
      </div>

      <ContactHostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hostId={hostId}
        hostName={name}
        propertyId={propertyId}
      />
    </div>
  );
};

export default HostProfile;
