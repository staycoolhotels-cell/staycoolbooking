import React, { useState } from 'react';
import { AmenityUpsell, AmenityTracking, AmenityType } from '../types';
import { PlusCircle, TrendingUp, XCircle } from 'lucide-react';

const dummyAmenities: AmenityUpsell[] = [
  {
    id: 'am1',
    name: 'Airport Pickup',
    description: 'Convenient transfer from/to the airport.',
    price: 50,
    currency: 'USD',
    type: 'Service',
    isActive: true,
  },
  {
    id: 'am2',
    name: 'Private Chef',
    description: 'Enjoy a gourmet meal prepared at your property.',
    price: 300,
    currency: 'USD',
    type: 'Experience',
    isActive: true,
    propertyId: 'prop1', // Specific to Luxury Villa
  },
  {
    id: 'am3',
    name: 'Early Check-in',
    description: 'Check-in 2 hours earlier than standard time.',
    price: 25,
    currency: 'USD',
    type: 'Service',
    isActive: false,
  },
];

const dummyAmenityTracking: AmenityTracking[] = [
  {
    amenityId: 'am1',
    amenityName: 'Airport Pickup',
    bookingCount: 12,
    revenueGenerated: 600,
    month: 'Jan',
  },
  {
    amenityId: 'am2',
    amenityName: 'Private Chef',
    bookingCount: 3,
    revenueGenerated: 900,
    month: 'Jan',
  },
  {
    amenityId: 'am3',
    amenityName: 'Early Check-in',
    bookingCount: 8,
    revenueGenerated: 200,
    month: 'Jan',
  },
];

const DynamicAmenityUpsell: React.FC = () => {
  const [amenities, setAmenities] = useState<AmenityUpsell[]>(dummyAmenities);

  const handleToggleActive = (id: string) => {
    setAmenities((prevAmenities) =>
      prevAmenities.map((amenity) =>
        amenity.id === id ? { ...amenity, isActive: !amenity.isActive } : amenity
      )
    );
  };

  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">Dynamic Amenity Upsell (Revenue+)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Amenity Manager</h2>
          <div className="space-y-3">
            {amenities.length > 0 ? (
              amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="p-3 border border-white/10 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {amenity.name} (₹{amenity.price})
                    </p>
                    <p className="text-sm text-zinc-400">{amenity.description}</p>
                  </div>
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      className="sr-only peer"
                      checked={amenity.isActive}
                      onChange={() => handleToggleActive(amenity.id)}
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-500 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-500"></div>
                    <span className="ml-3 text-sm font-medium text-zinc-100">
                      {amenity.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              ))
            ) : (
              <p className="text-white/50">No amenities defined.</p>
            )}
            <button className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/20">
              <PlusCircle size={20} className="mr-2" /> Add New Amenity
            </button>
          </div>
        </div>

        {/* Service Tracking */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Service Tracking (Monthly)</h2>
          {dummyAmenityTracking.length > 0 ? (
            <div className="space-y-3">
              {dummyAmenityTracking.map((tracking) => (
                <div key={tracking.amenityId} className="p-3 border border-white/10 rounded-xl">
                  <h3 className="font-semibold text-white">
                    {tracking.amenityName} ({tracking.month})
                  </h3>
                  <p className="text-sm text-zinc-400">Bookings: {tracking.bookingCount}</p>
                  <p className="text-sm text-sky-400 flex items-center">
                    <TrendingUp size={16} className="mr-1" /> Revenue: ₹
                    {tracking.revenueGenerated.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/50">No amenity tracking data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicAmenityUpsell;
