import React, { useMemo } from 'react';
import { PropertyOccupancy, GuestStatus, Booking } from '@/lib/types';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

const getStatusTheme = (status: GuestStatus) => {
  switch (status) {
    case 'In-house':
    case 'Checked-in':
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        text: 'text-green-400',
        dot: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]',
        hoverBorder: 'group-hover:border-green-500/50',
        icon: 'HomeIcon' as const
      };
    case 'Departure':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
        dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]',
        hoverBorder: 'group-hover:border-red-500/50',
        icon: 'ArrowRightOnRectangleIcon' as const
      };
    case 'Arrival':
    case 'Arriving Soon':
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-400',
        dot: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]',
        hoverBorder: 'group-hover:border-yellow-500/50',
        icon: 'ArrowLeftOnRectangleIcon' as const
      };
    default:
      return {
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/20',
        text: 'text-zinc-400',
        dot: 'bg-zinc-500 shadow-[0_0_10px_rgba(113,113,122,0.6)]',
        hoverBorder: 'group-hover:border-zinc-500/50',
        icon: 'UserIcon' as const
      };
  }
};

const OccupancyPulseCard: React.FC<{ occupancy: PropertyOccupancy }> = ({ occupancy }) => {
  const theme = getStatusTheme(occupancy.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative overflow-hidden ${theme.bg} backdrop-blur-md rounded-2xl border ${theme.border} ${theme.hoverBorder} mb-4 flex flex-col p-5 group transition-all duration-300 shadow-lg hover:shadow-2xl`}
    >
      {/* Decorative gradient orb */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 ${theme.bg} rounded-full blur-[30px] opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.bg} border ${theme.border} bg-white/5 backdrop-blur-sm shadow-inner`}>
            <Icon name={theme.icon} size={18} className={theme.text} />
          </div>
          <div>
            <p className="font-heading font-bold text-base text-zinc-100 drop-shadow-sm">{occupancy.guestName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full animate-pulse ${theme.dot}`}></span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.text}`}>{occupancy.status}</span>
            </div>
          </div>
        </div>

        {/* Dates Badge */}
        <div className="text-right">
          <div className="bg-black/40 border border-white/5 px-2.5 py-1 rounded-lg shadow-inner">
            <p className="text-[10px] text-zinc-400 font-mono tracking-wider">{new Date(occupancy.checkInDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
            <div className="w-full h-[1px] bg-white/10 my-0.5" />
            <p className="text-[10px] text-zinc-400 font-mono tracking-wider">{new Date(occupancy.checkOutDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-auto border-t border-white/5 relative z-10 flex items-center gap-2">
        <Icon name="MapPinIcon" size={14} className="text-zinc-500" />
        <p className="text-xs font-semibold text-zinc-300 truncate">{occupancy.propertyName}</p>
      </div>
    </motion.div>
  );
};

interface OccupancyPulseProps {
  bookings?: Booking[];
}

const OccupancyPulse: React.FC<OccupancyPulseProps> = ({ bookings = [] }) => {
  const occupancyData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return (bookings || [])
      .filter((b) => b && b.status === 'confirmed')
      .filter((b) => {
        const checkIn = b.check_in;
        const checkOut = b.check_out;
        if (!checkIn || !checkOut) return false;
        
        // Basic date range check
        const isInRange = checkIn <= today && checkOut >= today;
        if (!isInRange) return false;

        // If today is check-out day, check if current time is past check-out time
        if (checkOut === today) {
          const checkOutTimeStr = b.properties?.check_out_time || '11:00 AM';
          try {
            const [time, modifier] = checkOutTimeStr.split(' ');
            const [h, m] = time.split(':').map(Number);
            let hours = h;
            const minutes = m;
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            const checkOutTime = new Date();
            checkOutTime.setHours(hours, minutes, 0, 0);
            return new Date() <= checkOutTime;
          } catch (e) {
            return true;
          }
        }
        return true;
      })
      .map((b) => {
        let calculatedStatus: GuestStatus = 'In-house';
        if (b.check_in === today) calculatedStatus = 'Arrival';
        else if (b.check_out === today) calculatedStatus = 'Departure';

        return {
          id: b.id,
          propertyName: b.properties?.name || b.properties?.title || 'Stay Cool Property',
          guestName: b.guest?.name || 'Guest',
          status: calculatedStatus,
          checkInDate: b.check_in,
          checkOutDate: b.check_out,
        };
      });
  }, [bookings]);

  const inHouse = occupancyData.filter((o) => o.status === 'In-house');
  const departures = occupancyData.filter((o) => o.status === 'Departure');
  const arrivals = occupancyData.filter((o) => o.status === 'Arrival');

  const columns = [
    { title: 'In-house', data: inHouse, emptyTitle: 'No active stays', emptySubtitle: 'Rooms are currently empty.', icon: 'HomeModernIcon' as const, highlight: 'from-green-500/20' },
    { title: 'Departures', data: departures, emptyTitle: 'No check-outs today', emptySubtitle: 'All guests are extending their stay.', icon: 'ArrowRightOnRectangleIcon' as const, highlight: 'from-red-500/20' },
    { title: 'Arrivals', data: arrivals, emptyTitle: 'No check-ins today', emptySubtitle: 'Prepare for future bookings.', icon: 'ArrowLeftOnRectangleIcon' as const, highlight: 'from-yellow-500/20' },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 bg-[#0a0a0f]/80 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.3)]">
            <Icon name="HeartIcon" size={20} className="text-primary animate-pulse sm:hidden" />
            <Icon name="HeartIcon" size={28} className="text-primary animate-pulse hidden sm:block" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-heading font-black text-white tracking-tight drop-shadow-md">Occupancy Pulse</h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-400 mt-0.5">Real-time tracking of guest movements</p>
          </div>
        </div>
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#12121a] border border-white/10 rounded-xl flex items-center gap-2 shadow-inner relative z-10 w-full sm:w-auto justify-center">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse"></div>
          <span className="text-[10px] sm:text-xs font-bold text-zinc-200 uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {columns.map((col, idx) => (
          <div
            key={idx}
            className="bg-[#0a0a0f]/60 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border border-white/10 p-3 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col min-h-[180px] sm:min-h-[400px]"
          >
            {/* Column Header Glow */}
            <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${col.highlight} to-transparent opacity-20 pointer-events-none`} />

            <div className="flex justify-between items-center mb-3 sm:mb-6 relative z-10 border-b border-white/10 pb-2 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/5 rounded-lg border border-white/10">
                  <Icon name={col.icon} size={15} className="text-zinc-300 sm:hidden" />
                  <Icon name={col.icon} size={18} className="text-zinc-300 hidden sm:block" />
                </div>
                <h2 className="text-xs sm:text-sm font-heading font-bold text-white uppercase tracking-wider drop-shadow-md">
                  {col.title}
                </h2>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-white bg-white/10 border border-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-inner">
                {col.data.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pr-2">
              {col.data.length > 0 ? (
                col.data.map((occ) => <OccupancyPulseCard key={occ.id} occupancy={occ} />)
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-5 sm:py-10 opacity-60">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 sm:mb-4 shadow-inner">
                    <Icon name="ArchiveBoxXMarkIcon" size={16} className="text-zinc-500 sm:hidden" />
                    <Icon name="ArchiveBoxXMarkIcon" size={24} className="text-zinc-500 hidden sm:block" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-zinc-300 mb-0.5 sm:mb-1 tracking-wide">{col.emptyTitle}</p>
                  <p className="text-[10px] sm:text-xs font-medium text-zinc-500">{col.emptySubtitle}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OccupancyPulse;
