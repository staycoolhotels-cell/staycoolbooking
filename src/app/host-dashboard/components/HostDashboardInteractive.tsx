
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Wallet,
  UserCircle,
  Plus,
  Calendar,
  DollarSign,
  Building,
  Banknote,
  MessageSquare,
  Star,
  FolderKanban,
  Gift,
  ClipboardList,
  Scale,
  LifeBuoy,
} from 'lucide-react';
import Overview from './Overview';
import Properties from './Properties';
import Bookings from './Bookings';
import RealTimeChat from '@/components/chat/RealTimeChat';
import { supabase as libSupabase } from '@/lib/supabaseClient';
import Earnings from './Earnings';
import Profile from './Profile';
import OccupancyPulse from './OccupancyPulse'; // Imported OccupancyPulse
import RevenueForecasting from './RevenueForecasting'; // Imported RevenueForecasting
import SmartEstateManagement from './SmartEstateManagement'; // Imported SmartEstateManagement
import FinancialTreasury from './FinancialTreasury'; // Imported FinancialTreasury
import UnifiedInbox from './UnifiedInbox'; // Imported UnifiedInbox
import AuraQualityScore from './AuraQualityScore'; // Imported AuraQualityScore
import SmartDocumentVault from './SmartDocumentVault'; // Imported SmartDocumentVault
import DynamicAmenityUpsell from './DynamicAmenityUpsell'; // Imported DynamicAmenityUpsell
import CleaningMaintenanceLog from './CleaningMaintenanceLog';
import DisputesList from './DisputesList';
import AddPropertyModal, { FormData } from './AddPropertyModal';
import { Property, Transaction } from '@/lib/types';
import { createBrowserClient } from '@supabase/ssr';
import { AMENITIES } from '@/lib/amenities';
import AnimatedLoader from '@/components/ui/AnimatedLoader';
import AvailabilityCalendar from './AvailabilityCalendar';

const HostDashboardInteractive = ({
  hostData,
  accessToken,
}: {
  hostData: any;
  accessToken: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  type TabType =
    | 'overview'
    | 'properties'
    | 'bookings'
    | 'earnings'
    | 'profile'
    | 'occupancy-pulse'
    | 'revenue-velocity'
    | 'smart-estate'
    | 'financial-treasury'
    | 'unified-inbox'
    | 'aura-quality'
    | 'document-vault'
    | 'amenity-upsell'
    | 'cleaning-maintenance'
    | 'disputes'
    | 'availability'
    | 'support-chat';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>(hostData.properties);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoadingDisputes, setIsLoadingDisputes] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && [
      'overview', 'properties', 'bookings', 'earnings', 'profile',
      'occupancy-pulse', 'revenue-velocity', 'smart-estate', 'financial-treasury',
      'unified-inbox', 'aura-quality', 'document-vault', 'amenity-upsell',
      'cleaning-maintenance', 'disputes', 'availability', 'support-chat'
    ].includes(tab)) {
      setActiveTab(tab);
    } else {
      const newProperty = searchParams.get('new_property');
      if (newProperty) {
        setActiveTab('properties');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    setProperties(hostData.properties);
  }, [hostData.properties]);

  // Real-time unread message count
  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', hostData.id)
        .eq('is_read', false);
      setUnreadMessages(count ?? 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('host-unread-msgs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${hostData.id}`,
      }, () => fetchUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hostData.id]);

  // Clear badge when inbox is viewed
  useEffect(() => {
    if (activeTab === 'unified-inbox') {
      const t = setTimeout(() => setUnreadMessages(0), 800);
      return () => clearTimeout(t);
    }
  }, [activeTab]);

  // Real-time subscription for property updates
  useEffect(() => {
    const channel = supabase
      .channel('host-properties-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `host_id=eq.${hostData.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProperties((prev) => [...prev, payload.new as Property]);
          } else if (payload.eventType === 'UPDATE') {
            setProperties((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Property) : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setProperties((prev) => prev.filter((p) => p.id !== (payload.old as Property).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hostData.id, supabase]);

  const fetchDisputes = useCallback(async () => {
    setIsLoadingDisputes(true);
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('host_id', hostData.id)
      .order('createdDate', { ascending: false });

    if (!error) {
      setDisputes(data || []);
    }
    setIsLoadingDisputes(false);
  }, [hostData.id, supabase]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const fetchProperties = async () => {
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('host_id', hostData.id);

    if (!propertiesError) {
      setProperties(properties || []);
    }
  };


  const [hostName, setHostName] = useState(hostData.name);
  const [hostEmail, setHostEmail] = useState(hostData.email);
  const [hostPhotoUrl, setHostPhotoUrl] = useState(hostData.avatar_url);
  const [phoneNumber, setPhoneNumber] = useState(hostData.phone || '');
  const [address, setAddress] = useState(hostData.address || '');
  const [bio, setBio] = useState(hostData.bio || '');

  const handleSaveProperty = React.useCallback(
    async (formData: FormData) => {
      // Validate documents
      const uploadedDocsCount = [
        formData.license_url,
        formData.tax_bill_url,
        formData.current_bill_url
      ].filter(Boolean).length;

      if (uploadedDocsCount < 2) {
        alert('Please upload at least two of the following documents: Property License, Tax Bill, or Current Bill.');
        return;
      }

      const amenities = formData.amenities.map((amenityId) => {
        const amenity = AMENITIES.find((a) => a.id === amenityId);
        if (!amenity) return null;
        return {
          id: amenity.id,
          name: amenity.name,
          description: amenity.description,
          available: true,
        };
      }).filter((a): a is NonNullable<typeof a> => a !== null);

      if (propertyToEdit) {
        // Editing existing property
        const rpcParams = {
          p_id: propertyToEdit.id,
          p_name: String(formData.name),
          p_title: String(formData.name),
          p_description: String(formData.description),
          p_price_per_night: parseFloat(String(formData.price)) || 0,
          p_weekend_price_per_night: parseFloat(String(formData.weekendPrice)) || 0,
          p_tier: String(formData.type),
          p_amenities: amenities.length > 0 ? amenities : [],
          p_license_url: formData.license_url || '',
          p_tax_bill_url: formData.tax_bill_url || '',
          p_current_bill_url: formData.current_bill_url || '',
          p_image_url: formData.photo_urls[0] || '',
          p_images: formData.photo_urls.map((url, index) => ({ url, alt: `${formData.name} Photo ${index + 1}` })),
          p_cancellation_policy: formData.cancellationPolicy,
          p_rules: formData.rules,
          p_safety_items: formData.safetyItems,
          p_bedrooms: Number(formData.bedrooms) || 0,
          p_beds: Number(formData.beds) || 0,
          p_bathrooms: Number(formData.bathrooms) || 0,
          p_max_guests: Number(formData.maxGuests) || 0,
          p_area: Number(formData.area) || 0,
          p_co_host_name: formData.coHostName,
          p_co_host_email: formData.coHostEmail,
          p_address_line1: formData.addressLine1,
          p_address_line2: formData.addressLine2,
          p_landmark: formData.landmark,
          p_district: formData.district,
          p_city: formData.city,
          p_state: formData.state,
          p_postal_code: formData.postalCode,
          p_country: formData.country,
          p_show_specific_location: formData.showSpecificLocation,
          p_location: formData.city && formData.state ? `${formData.city}, ${formData.state}` : (formData.location || 'Unknown Location'),
          p_total_rooms: Number(formData.totalRooms) || 0,
          p_room_type: formData.roomType,
        };

        const { data, error } = await supabase.rpc('update_property', rpcParams);

        if (!error && data) {
          setProperties(
            properties.map((p) => (p.id === propertyToEdit.id ? (data[0] as Property) : p))
          );
          fetchProperties();
        } else if (error) {
          console.error('Error updating property via RPC:', error);
          alert(`Failed to update property: ${error.message || 'Unknown error'} (${error.code || 'N/A'})\n\nDetails: ${error.details || 'None'}\nHint: ${error.hint || 'None'}`);
        }
        setPropertyToEdit(null);
      } else {
        // Adding new property
        try {
          const rpcParams = {
            p_name: String(formData.name),
            p_title: String(formData.name),
            p_description: String(formData.description),
            p_price_per_night: parseFloat(String(formData.price)) || 0,
            p_weekend_price_per_night: parseFloat(String(formData.weekendPrice)) || 0,
            p_tier: String(formData.type),
            p_amenities: amenities.length > 0 ? amenities : [],
            p_license_url: formData.license_url || '',
            p_tax_bill_url: formData.tax_bill_url || '',
            p_current_bill_url: formData.current_bill_url || '',
            p_image_url: formData.photo_urls[0] || '',
            p_images: formData.photo_urls.map((url, index) => ({ url, alt: `${formData.name} Photo ${index + 1}` })),
            p_cancellation_policy: formData.cancellationPolicy,
            p_rules: formData.rules,
            p_safety_items: formData.safetyItems,
            p_bedrooms: Number(formData.bedrooms) || 0,
            p_beds: Number(formData.beds) || 0,
            p_bathrooms: Number(formData.bathrooms) || 0,
            p_max_guests: Number(formData.maxGuests) || 0,
            p_area: Number(formData.area) || 0,
            p_co_host_name: formData.coHostName,
            p_co_host_email: formData.coHostEmail,
            p_address_line1: formData.addressLine1,
            p_address_line2: formData.addressLine2,
            p_landmark: formData.landmark,
            p_district: formData.district,
            p_city: formData.city,
            p_state: formData.state,
            p_postal_code: formData.postalCode,
            p_country: formData.country,
            p_show_specific_location: formData.showSpecificLocation,
            p_location: formData.city && formData.state ? `${formData.city}, ${formData.state}` : (formData.location || 'Unknown Location'),
            p_total_rooms: Number(formData.totalRooms) || 0,
            p_room_type: formData.roomType,
          };

          const { data: newPropertyId, error } = await supabase.rpc('create_property', rpcParams);

          if (error) {
            console.error('Error creating property via RPC:', error);
            alert(`Failed to create property: ${error.message || 'Unknown error'} (${error.code || 'N/A'})\n\nDetails: ${error.details || 'None'}\nHint: ${error.hint || 'None'}`);
            return;
          }

          console.log('Property created successfully via RPC, ID:', newPropertyId);
          await fetchProperties();
        } catch (err) {
          console.error('Unexpected error creating property:', err);
          alert(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
      setIsModalOpen(false);
    },
    [properties, propertyToEdit, hostData.id, supabase]
  );

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
    setPropertyToEdit(null);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'occupancy-pulse', label: 'Occupancy Pulse', icon: Calendar },
    { id: 'revenue-velocity', label: 'Revenue Velocity', icon: DollarSign },
    { id: 'smart-estate', label: 'Smart Estate', icon: Building },
    { id: 'financial-treasury', label: 'Financial Treasury', icon: Banknote },
    { id: 'unified-inbox', label: 'Unified Inbox', icon: MessageSquare },
    { id: 'aura-quality', label: 'Aura Quality', icon: Star },
    { id: 'document-vault', label: 'Document Vault', icon: FolderKanban },
    { id: 'amenity-upsell', label: 'Amenity Upsell', icon: Gift },
    { id: 'cleaning-maintenance', label: 'Cleaning & Maintenance', icon: ClipboardList },
    { id: 'support-chat', label: 'Support Chat', icon: LifeBuoy },
    { id: 'disputes', label: 'Disputes', icon: Scale },
    { id: 'availability', label: 'Availability', icon: CalendarCheck },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'bookings', label: 'Reserve', icon: CalendarCheck },
    { id: 'earnings', label: 'Treasury', icon: Wallet },
    { id: 'profile', label: 'Identify', icon: UserCircle },
  ];

  function SupportChatSection({ currentUser }: { currentUser: { id: string; name: string } }) {
    const [adminUser, setAdminUser] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
      const fetchAdmin = async () => {
        const { data } = await supabase.from('users').select('id, name').eq('role', 'admin').limit(1).single();
        if (data) {
          setAdminUser({ id: data.id, name: data.name || 'Admin Support' });
        } else {
          setAdminUser({ id: '00000000-0000-0000-0000-000000000000', name: 'Admin Support' });
        }
      };
      fetchAdmin();
    }, [supabase]);

    return (
      <div className="w-full space-y-6 md:space-y-8 h-[calc(100vh-140px)] flex flex-col relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center gap-5 w-full lg:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0">
              <LifeBuoy size={32} className="text-indigo-400 drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg truncate">Priority Support</h1>
              <p className="text-xs md:text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2 truncate whitespace-nowrap">
                Direct Admin Communication
              </p>
            </div>
          </div>

          <div className="relative z-10 hidden sm:flex items-center gap-4">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
              <div className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">Live Connect</div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group flex flex-col">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-1000" />

          <div className="flex-1 relative z-10 flex flex-col p-2 md:p-6 overflow-hidden">
            {adminUser ? (
              <div className="flex-1 rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 shadow-inner bg-black/40 relative">
                <RealTimeChat
                  currentUser={currentUser}
                  otherUser={adminUser}
                  contextTitle="StayCool Platform Support"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <LifeBuoy size={32} className="text-indigo-500 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Connecting to Admin Network...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-100px)] w-full bg-[#080808] flex text-zinc-100">
      {/* Mobile Toggle Button - Moved to a cleaner position */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-24 left-4 z-[100] p-3 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl text-white hover:bg-zinc-800 transition-all active:scale-95"
        aria-label="Toggle Navigation"
      >
        {isMobileMenuOpen ? <Plus className="rotate-45" size={20} /> : <LayoutDashboard size={20} />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/80 z-[90] backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`fixed top-[100px] left-0 z-[95] w-72 h-[calc(100vh-100px)] bg-zinc-950 border-r border-zinc-900 flex flex-col items-center md:items-start py-6 px-4 transition-transform duration-500 ease-[0.32,0.72,0,1] md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.8)]' : '-translate-x-full'}`}>
        <div className="flex w-full items-center justify-between mb-6 px-4 md:hidden">
          <span className="text-sm font-black uppercase tracking-widest text-white/40">Navigation</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 bg-white/5 rounded-lg text-white/60"
          >
            <Plus className="rotate-45" size={18} />
          </button>
        </div>
        <div className="mb-0 px-4"></div>

        <nav className="flex-1 w-full space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            // Determine the icon to render
            let renderedIcon;
            if (item.id === 'revenue-velocity') {
              // Custom rendering for Indian Rupee symbol
              renderedIcon = (
                <span
                  className={`w-[22px] h-[22px] flex items-center justify-center font-bold ${isActive ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-200'
                    }`}
                >
                  ₹
                </span>
              );
            } else {
              // Default Lucide icon rendering
              const IconComponent = item.icon;
              renderedIcon = <IconComponent size={22} strokeWidth={isActive ? 2.5 : 1.5} />;
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  const newParams = new URLSearchParams(searchParams.toString());
                  newParams.set('tab', item.id);
                  router.push(`?${newParams.toString()}`, { scroll: false });
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group ${isActive
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
              >
                {renderedIcon}
                <span className="font-bold text-sm tracking-tight block flex-1 text-left">
                  {item.label}
                </span>
                {/* Unread dot for inbox */}
                {item.id === 'unified-inbox' && unreadMessages > 0 && activeTab !== 'unified-inbox' && (
                  <span className="relative flex h-2.5 w-2.5 ml-1 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 w-1 h-8 bg-sky-500 rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto w-full px-2">
          <button
            onClick={() => router.push('/homepage')}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LayoutDashboard size={22} className="rotate-180" />
            <span className="font-bold text-sm block">Exit</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 relative overflow-y-auto bg-[#080808] ml-0 md:ml-72 w-full">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="px-4 sm:px-6 md:px-16 py-6 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            >
              {/* Content Canvas */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-[2rem] p-1 shadow-2xl overflow-hidden md:overflow-visible">
                <div className="bg-zinc-950/50 rounded-[1.8rem] p-4 sm:p-6 md:p-8">
                  {activeTab === 'overview' && (
                    <Overview
                      properties={properties}
                      bookings={hostData.bookings}
                      earnings={hostData.earnings}
                      reviews={hostData.reviews}
                      disputes={disputes}
                      onAction={setActiveTab as (tab: string) => void}
                    />
                  )}
                  {activeTab === 'properties' && (
                    <Properties
                      properties={properties}
                      onAddProperty={() => {
                        setPropertyToEdit(null);
                        setIsModalOpen(true);
                      }}
                      onEdit={(id) => {
                        const prop = properties.find((p) => p.id === id);
                        if (prop) {
                          setPropertyToEdit(prop);
                          setIsModalOpen(true);
                        }
                      }}
                      onDelete={(id) => setProperties((p) => p.filter((x) => x.id !== id))}
                      onToggleStatus={async (id, newStatus) => {
                        try {
                          const { error } = await supabase.rpc('toggle_property_status', {
                            p_id: id,
                            p_status: newStatus,
                          });

                          if (error) {
                            console.error('Error toggling status:', error);
                            alert(`Failed to update status: ${error.message}`);
                            return;
                          }

                          // Optimistic update successful
                          setProperties((p) =>
                            p.map((x) => (x.id === id ? { ...x, status: newStatus } : x))
                          );
                        } catch (err) {
                          console.error('Unexpected error toggling status:', err);
                          alert('An unexpected error occurred');
                        }
                      }}
                    />
                  )}
                  {activeTab === 'bookings' && (
                    <Bookings bookings={hostData.bookings} searchTerm="" setSearchTerm={() => { }} onAction={setActiveTab as (tab: string) => void} />
                  )}
                  {activeTab === 'earnings' && <Earnings earnings={hostData.transactions} />}
                  {activeTab === 'occupancy-pulse' && <OccupancyPulse bookings={hostData.bookings} />}
                  {activeTab === 'revenue-velocity' && <RevenueForecasting bookings={hostData.bookings} />}
                  {activeTab === 'smart-estate' && <SmartEstateManagement properties={properties} />}
                  {activeTab === 'financial-treasury' && <FinancialTreasury transactions={hostData.transactions} />}
                  {activeTab === 'unified-inbox' && <UnifiedInbox />}
                  {activeTab === 'aura-quality' && <AuraQualityScore properties={properties} />}
                  {activeTab === 'document-vault' && <SmartDocumentVault properties={properties} />}
                  {activeTab === 'amenity-upsell' && <DynamicAmenityUpsell />}
                  {activeTab === 'cleaning-maintenance' && <CleaningMaintenanceLog properties={properties} />}
                  {activeTab === 'disputes' && <DisputesList disputes={disputes} isLoading={isLoadingDisputes} />}
                  {activeTab === 'availability' && <AvailabilityCalendar properties={properties} />}
                  {activeTab === 'support-chat' && (
                    <SupportChatSection currentUser={{ id: hostData.id, name: hostData.name }} />
                  )}
                  {activeTab === 'profile' && (
                    <Profile
                      hostName={hostName}
                      hostEmail={hostEmail}
                      hostPhotoUrl={hostPhotoUrl}
                      phoneNumber={phoneNumber}
                      address={address}
                      bio={bio}
                      onUpdateHostName={setHostName}
                      onUpdateHostEmail={setHostEmail}
                      onUpdateHostPhoto={setHostPhotoUrl}
                      onUpdatePhoneNumber={setPhoneNumber}
                      onUpdateAddress={setAddress}
                      onUpdateBio={setBio}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3. MODAL: Geometric Slide */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl md:rounded-[3rem] p-5 md:p-10 shadow-3xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6 md:mb-8 pb-4 md:pb-6 border-b border-zinc-900">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter">Materialize Estate</h3>
                <button
                  onClick={handleCloseModal}
                  className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-zinc-900 transition-colors"
                >
                  <Plus className="rotate-45 text-zinc-500" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <AddPropertyModal
                  isOpen={isModalOpen}
                  onClose={handleCloseModal}
                  onSaveProperty={handleSaveProperty}
                  propertyToEdit={propertyToEdit}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HostDashboardInteractive;

