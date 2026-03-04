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
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Fetch properties only once on mount
      const { data, error } = await supabase.from('properties').select('*');

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data || []);
      }

      setLoading(false);
    };

    checkAuthAndFetchProperties();
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading properties...</div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Property Management"
        subtitle="Review and manage all platform listings"
      />
      <PropertyList initialProperties={properties} />
    </div>
  );
};

export default PropertyManagementPage;
