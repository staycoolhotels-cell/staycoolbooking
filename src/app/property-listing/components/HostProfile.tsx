import React from 'react';
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
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-4 md:mb-6">
        Meet Your Host
      </h2>

      {/* Host info row */}
      <div className="flex items-center gap-3 md:gap-5 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-white/[0.07]">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/40">
            <AppImage
              src={avatar}
              alt={avatarAlt}
              className="w-full h-full"
              fill={true}
              objectFit="cover"
            />
          </div>
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-success rounded-full flex items-center justify-center border-2 border-black shadow">
              <Icon name="CheckIcon" size={10} className="text-white" />
            </div>
          )}
        </div>

        {/* Name & meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-base md:text-xl font-bold text-white">{name}</h3>
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 border border-success/20 rounded-full">
                <Icon name="CheckBadgeIcon" size={11} className="text-success" variant="solid" />
                <span className="text-[9px] font-bold tracking-wide text-success uppercase">Verified</span>
              </span>
            )}
          </div>
          {coHostName && (
            <p className="text-xs text-zinc-500 mb-0.5">
              Co-Hosted by <span className="text-zinc-300 font-semibold">{coHostName}</span>
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Icon name="CalendarDaysIcon" size={12} className="text-zinc-600" />
            <span>Joined {joinedDate}</span>
          </div>
        </div>
      </div>

      {/* Stats row — inline pill style */}
      <div className="flex items-stretch gap-2 mb-4 md:mb-6">
        <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
          <span className="text-sm md:text-xl font-extrabold text-white leading-none">{responseRate}%</span>
          <span className="text-[9px] md:text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-1 text-center">Response Rate</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
          <span className="text-[11px] md:text-xl font-extrabold text-white leading-tight text-center">{responseTime}</span>
          <span className="text-[9px] md:text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-1 text-center">Response Time</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
          <span className="text-sm md:text-xl font-extrabold text-white leading-none">{totalProperties}</span>
          <span className="text-[9px] md:text-[11px] text-zinc-500 uppercase tracking-wider font-medium mt-1 text-center">Properties</span>
        </div>
      </div>

      {/* Bio */}
      {bio && bio !== 'No bio available.' ? (
        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed mb-4 md:mb-6">{bio}</p>
      ) : (
        <p className="text-xs md:text-sm text-zinc-600 italic leading-relaxed mb-4 md:mb-6">No bio available.</p>
      )}

      {/* Contact button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 md:py-3 bg-white/[0.06] border border-white/10 hover:bg-white/[0.10] hover:border-white/20 text-white rounded-2xl font-semibold text-sm transition-all duration-300 active:scale-95"
      >
        <Icon name="ChatBubbleLeftRightIcon" size={16} className="text-white/70" />
        <span>Contact Host</span>
      </button>

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
