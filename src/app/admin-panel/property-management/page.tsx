'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import PropertyList from './components/PropertyList';
import { Property } from '@/lib/types';
import AdminPageHeader from '../components/AdminPageHeader';

const PropertyManagementPage = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchProperties = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase.from('properties').select('*');

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data || []);
      }

      setLoading(false);
    };

    checkAuthAndFetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] px-4 md:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8 pt-2">
            <div className="space-y-2">
              <div className="h-8 w-56 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-4 w-72 bg-white/5 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4 animate-pulse">
                <div className="h-3 w-16 bg-white/5 rounded mb-2" />
                <div className="h-8 w-10 bg-white/8 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#0a0a0f] border border-white/10 overflow-hidden animate-pulse">
                <div className="h-36 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-white/5 rounded-lg" />
                  <div className="h-3 w-1/2 bg-white/5 rounded" />
                  <div className="flex gap-2">
                    <div className="h-8 flex-1 bg-white/5 rounded-xl" />
                    <div className="h-8 flex-1 bg-white/5 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 md:px-6 lg:px-8 pb-16">
      <div className="max-w-7xl mx-auto">
        <AdminPageHeader
          title="Property Management"
          subtitle="Review and manage all platform listings"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </AdminPageHeader>

        <PropertyList initialProperties={properties} />
      </div>
    </div>
  );
};

export default PropertyManagementPage;
