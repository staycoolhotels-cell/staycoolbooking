
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
} from 'lucide-react'; // Changed CurrencyDollar to DollarSign
import Overview from './Overview';
import Properties from './Properties';
import Bookings from './Bookings';
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
import CleaningMaintenanceLog from './CleaningMaintenanceLog'; // Imported CleaningMaintenanceLog
import AddPropertyModal, { FormData } from './AddPropertyModal';
import { Property } from '@/lib/types';
import { createBrowserClient } from '@supabase/ssr';
import { AMENITIES } from '@/lib/amenities';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>(hostData.properties);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);

  useEffect(() => {
    const newProperty = searchParams.get('new_property');
    if (newProperty) {
      setActiveTab('properties');
    }
  }, [searchParams]);

  useEffect(() => {
    setProperties(hostData.properties);
  }, [hostData.properties]);

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
      const uploadedDocsCount = [formData.license[0], formData.taxBill[0], formData.currentBill[0]].filter(Boolean).length;
      if (uploadedDocsCount < 2) {
        alert('Please upload at least two of the following documents: Property License, Tax Bill, or Current Bill.');
        return;
      }

      const uploadFile = async (file: File, bucket: string) => {
        if (!file) return null;
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(`${hostData.id}/${file.name}`, file, {
            cacheControl: '3600',
            upsert: true,
          });
        if (error) {
          console.error('Error uploading file:', error);
          return null;
        }
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrlData.publicUrl;
      };

      const imageUrls = await Promise.all(formData.photos.map(file => uploadFile(file, 'images')));

      const amenities = formData.amenities.map((amenityId) => {
        const amenity = AMENITIES.find((a) => a.id === amenityId);
        return {
          id: amenity.id,
          name: amenity.name,
          description: amenity.description,
          available: true,
        };
      });

      const licenseUrl = await uploadFile(formData.license[0], 'documents');
      const taxBillUrl = await uploadFile(formData.taxBill[0], 'documents');
      const currentBillUrl = await uploadFile(formData.currentBill[0], 'documents');

      if (propertyToEdit) {
        // Editing existing property
        const { data, error } = await supabase
          .from('properties')
          .update({
            name: formData.name,
            title: formData.name,
            description: formData.description,
            price_per_night: formData.price,
            weekend_price_per_night: formData.weekendPrice,
            location: formData.location,
            tier: formData.type,
            amenities,
            license_url: licenseUrl,
            tax_bill_url: taxBillUrl,
            current_bill_url: currentBillUrl,
            image_url: imageUrls.filter(Boolean)[0] || '',
          })
          .eq('id', propertyToEdit.id)
          .select();

        if (!error && data) {
          setProperties(
            properties.map((p) => (p.id === propertyToEdit.id ? (data[0] as Property) : p))
          );
          fetchProperties();
        }
        setPropertyToEdit(null);
      } else {
        // Adding new property
        const { data, error } = await supabase.rpc('create_property', {
          name: formData.name,
          title: formData.name,
          description: formData.description,
          price_per_night: formData.price,
          weekend_price_per_night: formData.weekendPrice,
          location: formData.location,
          tier: formData.type,
          amenities,
          license_url: licenseUrl,
          tax_bill_url: taxBillUrl,
          current_bill_url: currentBillUrl,
          image_url: imageUrls.filter(Boolean)[0] || '',
        });

        if (!error) {
          fetchProperties();
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
    { id: 'cleaning-maintenance', label: 'Cleaning & Maintenance', icon: ClipboardList }, // Added Cleaning & Maintenance
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'bookings', label: 'Reserve', icon: CalendarCheck },
    { id: 'earnings', label: 'Treasury', icon: Wallet },
    { id: 'profile', label: 'Identify', icon: UserCircle },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#080808] flex text-zinc-100">
      {/* 1. SIDEBAR NAVIGATION (Replacing Header) */}
      <aside className="fixed top-0 left-0 z-50 w-24 md:w-64 h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col items-center md:items-start py-10 px-4">
        <div className="mb-16 px-4"></div>

        <nav className="flex-1 w-full space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            // Determine the icon to render
            let renderedIcon;
            if (item.id === 'revenue-velocity') {
              // Custom rendering for Indian Rupee symbol
              renderedIcon = (
                <span
                  className={`w-[22px] h-[22px] flex items-center justify-center font-bold ${
                    isActive ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-200'
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
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {renderedIcon}
                <span className="font-bold text-sm tracking-tight hidden md:block">
                  {item.label}
                </span>
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
            <span className="font-bold text-sm hidden md:block">Exit</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 relative overflow-y-auto bg-[#080808] ml-24 md:ml-64">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="px-8 md:px-16 py-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
            >
              {/* Content Canvas */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-[2rem] p-1 shadow-2xl">
                <div className="bg-zinc-950/50 rounded-[1.8rem] p-8 md:p-12">
                  {activeTab === 'overview' && (
                    <Overview
                      properties={properties}
                      bookings={hostData.bookings}
                      earnings={hostData.earnings}
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
                        const { error } = await supabase
                          .from('properties')
                          .update({ status: newStatus })
                          .eq('id', id);
                        if (!error) {
                          setProperties((p) =>
                            p.map((x) => (x.id === id ? { ...x, status: newStatus } : x))
                          );
                        }
                      }}
                    />
                  )}
                  {activeTab === 'bookings' && (
                    <Bookings bookings={hostData.bookings} searchTerm="" setSearchTerm={() => {}} />
                  )}
                  {activeTab === 'earnings' && <Earnings earnings={hostData.earnings} />}
                  {activeTab === 'occupancy-pulse' && <OccupancyPulse />}
                  {activeTab === 'revenue-velocity' && <RevenueForecasting />}
                  {activeTab === 'smart-estate' && <SmartEstateManagement />}
                  {activeTab === 'financial-treasury' && <FinancialTreasury />}
                  {activeTab === 'unified-inbox' && <UnifiedInbox />}
                  {activeTab === 'aura-quality' && <AuraQualityScore />}
                  {activeTab === 'document-vault' && <SmartDocumentVault />}
                  {activeTab === 'amenity-upsell' && <DynamicAmenityUpsell />}
                  {activeTab === 'cleaning-maintenance' && <CleaningMaintenanceLog />}{' '}
                  {/* Render CleaningMaintenanceLog */}
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
              className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-10 shadow-3xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-900">
                <h3 className="text-3xl font-bold tracking-tighter">Materialize Estate</h3>
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
