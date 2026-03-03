import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export type AmenityType = 'Service' | 'Experience' | 'Physical';

export interface AmenityData {
  id: string;
  host_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: AmenityType | string;
  is_active: boolean;
  property_id?: string;
  created_at: string;
}

export interface AmenityTrackingData {
  id: string;
  amenity_id: string;
  amenity_name?: string;
  booking_count: number;
  revenue_generated: number;
  month: string;
  created_at: string;
}

const DynamicAmenityUpsell: React.FC = () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [amenities, setAmenities] = useState<AmenityData[]>([]);
  const [trackingData, setTrackingData] = useState<AmenityTrackingData[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newAmenity, setNewAmenity] = useState({
    name: '',
    description: '',
    price: '',
    type: 'Service'
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAdding(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      const newAmenityData = {
        host_id: user.id,
        name: newAmenity.name,
        description: newAmenity.description,
        price: parseFloat(newAmenity.price) || 0,
        currency: 'INR',
        type: newAmenity.type,
        is_active: true
      };

      const { data: insertedAmenity, error: insertError } = await supabase
        .from('amenities')
        .insert([newAmenityData])
        .select()
        .single();

      if (insertError) {
        console.error("DB Insert Error:", insertError);
        // Fallback for UI if table or schema is missing 
        const fallbackAmenity: AmenityData = {
          ...newAmenityData,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        setAmenities(prev => [...prev, fallbackAmenity].sort((a, b) => a.name.localeCompare(b.name)));
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (insertedAmenity) {
        setAmenities(prev => [...prev, insertedAmenity].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setShowAddModal(false);
      setNewAmenity({ name: '', description: '', price: '', type: 'Service' });
    } catch (error: any) {
      console.error("Error adding amenity:", error);
      alert(error.message || "Failed to add amenity");
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch Amenities for this host
        const { data: amenitiesData, error: amenitiesError } = await supabase
          .from('amenities')
          .select('*')
          .eq('host_id', user.id)
          .order('name', { ascending: true });

        if (amenitiesData && !amenitiesError) {
          setAmenities(amenitiesData);

          // If we have amenities, fetch tracking data
          const amenityIds = amenitiesData.map(a => a.id);
          if (amenityIds.length > 0) {
            const { data: tracking, error: trackingError } = await supabase
              .from('amenity_tracking')
              .select('*')
              .in('amenity_id', amenityIds)
              .order('month', { ascending: false });

            if (tracking && !trackingError) {
              // Map amenity names into tracking data for display
              const enrichedTracking = tracking.map((t: any) => ({
                ...t,
                amenity_name: amenitiesData.find(a => a.id === t.amenity_id)?.name || 'Unknown Amenity'
              }));
              setTrackingData(enrichedTracking);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching Amenity data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistic Update
    setAmenities((prevAmenities) =>
      prevAmenities.map((amenity) =>
        amenity.id === id ? { ...amenity, is_active: !currentStatus } : amenity
      )
    );

    // DB Update
    const { error } = await supabase
      .from('amenities')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error("Failed to update amenity state", error);
      // Revert if error
      setAmenities((prevAmenities) =>
        prevAmenities.map((amenity) =>
          amenity.id === id ? { ...amenity, is_active: currentStatus } : amenity
        )
      );
    }
  };

  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">Dynamic Amenity Upsell (Revenue+)</h1>

      {loading ? (
        <div className="text-white/50 animate-pulse">Loading Amenities...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Amenity Manager</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
                      {amenity.type && <p className="text-xs text-zinc-500 mt-1">Type: {amenity.type}</p>}
                    </div>
                    <label className="inline-flex relative items-center cursor-pointer">
                      <input
                        type="checkbox"
                        value=""
                        className="sr-only peer"
                        checked={amenity.is_active}
                        onChange={() => handleToggleActive(amenity.id, amenity.is_active)}
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-500 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-500"></div>
                      <span className="ml-3 text-sm font-medium text-zinc-100">
                        {amenity.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-sm">No amenities defined yet.</p>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/20"
              >
                <PlusCircle size={20} className="mr-2" /> Add New Amenity
              </button>
            </div>
          </div>

          {/* Service Tracking */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Service Tracking (Monthly)</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {trackingData.length > 0 ? (
                trackingData.map((tracking) => (
                  <div key={tracking.id} className="p-3 border border-white/10 rounded-xl">
                    <h3 className="font-semibold text-white">
                      {tracking.amenity_name} ({tracking.month})
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">Bookings: {tracking.booking_count}</p>
                    <p className="text-sm text-sky-400 flex items-center mt-1">
                      <TrendingUp size={16} className="mr-1" /> Revenue: ₹
                      {Number(tracking.revenue_generated).toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-sm">No amenity tracking data available automatically.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Amenity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md p-6 border border-zinc-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add New Amenity</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Amenity Name</label>
                <input
                  type="text"
                  value={newAmenity.name}
                  onChange={(e) => setNewAmenity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Airport Transfer"
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                <input
                  type="text"
                  value={newAmenity.description}
                  onChange={(e) => setNewAmenity(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Round-trip transfer from airport"
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={newAmenity.price}
                  onChange={(e) => setNewAmenity(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g. 1500"
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
                <select
                  value={newAmenity.type}
                  onChange={(e) => setNewAmenity(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="Service">Service</option>
                  <option value="Experience">Experience</option>
                  <option value="Physical">Physical Item</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-white/70 hover:text-white mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {isAdding ? 'Adding...' : 'Add Amenity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicAmenityUpsell;
