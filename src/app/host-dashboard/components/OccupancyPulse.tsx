import React, { useMemo } from 'react';
import { PropertyOccupancy, GuestStatus, Booking } from '@/lib/types';
import { motion } from 'framer-motion';

const getStatusColor = (status: GuestStatus): string => {
  switch (status) {
    case 'In-house':
    case 'Checked-in':
      return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    case 'Departure':
      return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
    case 'Arrival':
    case 'Arriving Soon':
      return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    default:
      return 'bg-zinc-600';
  }
};

const OccupancyPulseCard: React.FC<{ occupancy: PropertyOccupancy }> = ({ occupancy }) => {
  const statusColor = getStatusColor(occupancy.status);
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 mb-3 flex items-center hover:bg-white/[0.06] transition-all"
    >
      <span className={`w-2.5 h-2.5 rounded-full ${statusColor} mr-4`}></span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-white truncate">{occupancy.propertyName}</p>
        <p className="text-xs text-zinc-400 mt-0.5 truncate">
          {occupancy.guestName} • <span className="opacity-60">{occupancy.status}</span>
        </p>
        <p className="text-[10px] text-zinc-600 font-mono mt-1 italic">
          {occupancy.checkInDate} — {occupancy.checkOutDate}
        </p>
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

    // Filter bookings that overlap with today
    return (bookings || [])
      .filter((b) => b && b.status === 'confirmed')
      .filter((b) => {
        const checkIn = b.check_in;
        const checkOut = b.check_out;
        if (!checkIn || !checkOut) return false;
        return checkIn <= today && checkOut >= today;
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

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Stay Activity</h1>
        <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
          <span className="text-[10px] font-black text-blue-500 uppercase">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'In-house', data: inHouse, empty: 'No active stays' },
          { title: 'Departures', data: departures, empty: 'No check-outs' },
          { title: 'Arrivals', data: arrivals, empty: 'No check-ins' },
        ].map((col, idx) => (
          <div
            key={idx}
            className="bg-white/[0.02] rounded-[2.5rem] border border-white/5 p-6 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {col.title}
              </h2>
              <span className="text-[10px] font-mono text-zinc-600 px-2 py-0.5 bg-white/5 rounded-md">
                {col.data.length}
              </span>
            </div>
            {col.data.length > 0 ? (
              col.data.map((occ) => <OccupancyPulseCard key={occ.id} occupancy={occ} />)
            ) : (
              <p className="text-zinc-700 text-xs italic py-4">{col.empty}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OccupancyPulse;

