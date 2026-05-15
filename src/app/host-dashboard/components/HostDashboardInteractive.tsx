
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
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
  Banknote,
  MessageSquare,
  Star,
  ClipboardList,
  Scale,
  LifeBuoy,
  Lock,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { resetCancellationPenalty } from '@/lib/booking-actions';
import { createHostSignupOrder } from '@/lib/payment-actions';
import { approveHost } from '@/lib/admin-actions';
import { updateHostProfile } from '@/lib/host-actions';
import Overview from './Overview';
import Properties from './Properties';
import Bookings from './Bookings';
import RealTimeChat from '@/components/chat/RealTimeChat';
import Earnings from './Earnings';
import Profile from './Profile';
import OccupancyPulse from './OccupancyPulse'; // Imported OccupancyPulse
import RevenueForecasting from './RevenueForecasting'; // Imported RevenueForecasting
import UnifiedInbox from './UnifiedInbox'; // Imported UnifiedInbox
import AuraQualityScore from './AuraQualityScore'; // Imported AuraQualityScore
import DynamicAmenityUpsell from './DynamicAmenityUpsell'; // Imported DynamicAmenityUpsell
import CleaningMaintenanceLog from './CleaningMaintenanceLog';
import DisputesList from './DisputesList';
import BankingDetails from './BankingDetails';

import PayoutHistory from './PayoutHistory';
import AddPropertyModal, { FormData } from './AddPropertyModal';
import { deleteProperty } from '@/lib/property-actions';

import { Property, Transaction, HostDashboardData, Dispute } from '@/lib/types';
import { createBrowserClient } from '@supabase/ssr';
import { AMENITIES } from '@/lib/amenities';
import AvailabilityCalendar from './AvailabilityCalendar';
import { useAppStore } from '@/lib/store';

const HostDashboardInteractive = ({
  hostData,
  accessToken,
}: {
  hostData: HostDashboardData;
  accessToken: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    properties: cachedProperties, 
    setProperties: setStoreProperties, 
    setBookings: setStoreBookings 
  } = useAppStore();

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

  // Sync initial data to store on mount
  useEffect(() => {
    if (hostData.properties) setStoreProperties(hostData.properties);
    if (hostData.bookings) setStoreBookings(hostData.bookings);
  }, [hostData.properties, hostData.bookings, setStoreProperties, setStoreBookings]);

  type TabType =
    | 'overview'
    | 'properties'
    | 'bookings'
    | 'earnings'
    | 'profile'
    | 'occupancy-pulse'
    | 'revenue-velocity'
    | 'unified-inbox'
    | 'aura-quality'
    | 'amenity-upsell'
    | 'cleaning-maintenance'
    | 'disputes'
    | 'availability'
    | 'support-chat'
    | 'banking-details'
    | 'payout-history';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Local state for UI responsiveness, initialized from hostData
  const [properties, setProperties] = useState<Property[]>(hostData.properties);
  
  // Sync local state when store changes (e.g., from other components)
  useEffect(() => {
    if (cachedProperties && cachedProperties.length > 0) {
      setProperties(cachedProperties);
    }
  }, [cachedProperties]);

  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoadingDisputes, setIsLoadingDisputes] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  type InboxContext = {
    guest_id: string;
    sender_name: string;
    sender_avatar?: string;
    property_id: string;
    property_name: string;
  };

  const [inboxContext, setInboxContext] = useState<InboxContext | null>(null);
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');

  const isLocked = Number(hostData.cancellation_count || 0) >= 5;
  const isPending = hostData.status === 'pending';

  const PendingApprovalOverlay = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
      setIsProcessing(true);
      try {
        const order = await createHostSignupOrder();
        if (!order.success) {
          toast.error("Failed to initiate payment: " + order.error);
          return;
        }

        const payment: unknown = await new Promise((resolve, reject) => {
          if (typeof (window as any).Razorpay === 'undefined') {
            reject(new Error('Razorpay SDK not loaded.'));
            return;
          }

          const options = {
            key: order.key_id,
            amount: order.amount,
            currency: order.currency,
            name: "StayCool",
            description: "Host Account Approval Fee",
            order_id: order.orderId,
            handler: (response: unknown) => resolve(response),
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled')),
            },
            prefill: {
              email: hostData.email,
              name: hostData.name
            },
            theme: { color: "#0ea5e9" }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        });

        // Verification call
        const { success } = await approveHost(hostData.id);
        if (success) {
          toast.success("Payment successful! Your account is now active.");
          window.location.reload();
        } else {
          toast.error("Account activation failed. Please contact support.");
        }
      } catch (_err: unknown) {
        if ((_err as any)?.message !== 'Payment cancelled') {
          toast.error("Payment failed: " + (_err as any)?.message);
        }
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-[#0a0a0f] border border-brand-default/20 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(212,175,55,0.15)] text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-default to-transparent" />
          
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-brand-default/10 border border-brand-default/20 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.2)]">
              <Lock size={40} className="text-brand-default" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase italic">Account Pending</h2>
          
          <div className="space-y-4 mb-10">
            <p className="text-lg text-white/90 font-bold leading-relaxed px-4">
              మీ హోస్ట్ అకౌంట్ యాక్టివేట్ అవ్వాలంటే ₹299 ఫీజు చెల్లించాలి. ఫీజు కట్టిన వెంటనే మీ అకౌంట్ ఆటోమేటిక్ గా అప్రూవ్ అవుతుంది.
            </p>
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-[0.2em]">
              Pay ₹299 for Instant Approval & Listing Access
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-5 bg-gradient-to-r from-brand-deep to-brand-default text-black font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_-10px_rgba(212,175,55,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {isProcessing ? (
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Banknote size={20} className="group-hover:rotate-12 transition-transform" />
                Pay ₹299 & Activate Now
              </>
            )}
          </button>
          
          <p className="mt-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            Instant Activation • Secure Payment
          </p>
        </motion.div>
      </div>
    );
  };

  const PenaltyOverlay = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
      setIsProcessing(true);
      try {
        await resetCancellationPenalty();
        toast.success("Payment successful! Your dashboard has been unlocked.");
      } catch (err) {
        toast.error("Payment failed. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-[#0a0a0f] border border-red-500/20 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(239,68,68,0.15)] text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase italic">Access Revoked</h2>
          
          <div className="space-y-4 mb-10">
            <p className="text-lg text-white/90 font-bold leading-relaxed px-4">
              మరీ ఎక్కువ బుకింగ్స్ రిజెక్ట్ చేయడం వల్ల మీ అకౌంట్ లాక్ చేయబడింది. మళ్ళీ అకౌంట్ ఓపెన్ అవ్వాలంటే 299 రూపాయలు పెనాల్టీ కట్టాలి.
            </p>
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-[0.2em]">
              Account locked due to 5+ rejected bookings
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {isProcessing ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Banknote size={20} className="group-hover:rotate-12 transition-transform" />
                Pay ₹299 Penalty & Unlock
              </>
            )}
          </button>
          
          <p className="mt-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            Secure Payment Gateway • Instant Restoration
          </p>
        </motion.div>
      </div>
    );
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && [
      'overview', 'properties', 'bookings', 'earnings', 'profile',
      'occupancy-pulse', 'revenue-velocity', 'financial-treasury',
      'unified-inbox', 'aura-quality', 'amenity-upsell',
      'cleaning-maintenance', 'disputes', 'availability', 'support-chat',
      'banking-details', 'payout-history'
    ].includes(tab)) {
      setActiveTab(tab);
    } else {
      const newProperty = searchParams.get('new_property');
      if (newProperty) {
        setActiveTab('properties');
      }
    }
  }, [searchParams]);

  const handleAction = useCallback((tab: string, data?: any) => {
    setActiveTab(tab as TabType);
    if (tab === 'unified-inbox' && data) {
      setInboxContext(data);
    } else if (tab !== 'unified-inbox') {
      setInboxContext(null);
    }

    const newParams = new URLSearchParams(window.location.search);
    newParams.set('tab', tab);
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router]);

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

  // Real-time subscription for disputes updates
  useEffect(() => {
    const channel = supabase
      .channel('host-disputes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'disputes',
          filter: `host_id=eq.${hostData.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDisputes((prev) => [payload.new as Dispute, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDisputes((prev) =>
              prev.map((d) => (d.id === (payload.new as Dispute).id ? (payload.new as Dispute) : d))
            );
          } else if (payload.eventType === 'DELETE') {
            setDisputes((prev) => prev.filter((d) => d.id !== (payload.old as Dispute).id));
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
  const [gender, setGender] = useState(hostData.gender || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleUpdateProfile = async (newData: any) => {
    setIsSavingProfile(true);
    try {
      const result = await updateHostProfile(
        hostData.id,
        {
          name: newData.name || hostName,
          email: newData.email || hostEmail,
          avatar_url: newData.avatar_url || hostPhotoUrl,
          phone: newData.phone || phoneNumber,
        },
        {
          bio: newData.bio || bio,
          address: newData.address || address,
          gender: newData.gender || gender,
        }
      );

      if (result.success) {
        toast.success('Profile updated successfully!');
        if (newData.name) setHostName(newData.name);
        if (newData.email) setHostEmail(newData.email);
        if (newData.avatar_url) setHostPhotoUrl(newData.avatar_url);
        if (newData.phone) setPhoneNumber(newData.phone);
        if (newData.address) setAddress(newData.address);
        if (newData.bio) setBio(newData.bio);
        if (newData.gender) setGender(newData.gender);
      } else {
        toast.error('Failed to update profile: ' + result.error);
      }
    } catch (err) {
      toast.error('An unexpected error occurred while saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${hostData.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const result = await updateHostProfile(hostData.id, { avatar_url: publicUrl }, {});
      if (result.success) {
        setHostPhotoUrl(publicUrl);
        toast.success('Profile picture updated!');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast.error('Failed to upload image: ' + err.message);
    }
  };


  const handleSaveProperty = React.useCallback(
    async (formData: FormData) => {
      // Validate documents — different requirements for Tent vs other property types
      if (formData.type === 'Tent') {
        const tentDocsCount = [
          formData.aadhar_url,
          formData.pan_url,
          formData.noc_url,
        ].filter(Boolean).length;
        if (tentDocsCount < 2) {
          alert('Tent property కోసం కనీసం 2 documents upload చేయాలి (Aadhaar, PAN, లేదా NOC లో ఏవైనా 2).');
          return;
        }
      } else {
        const uploadedDocsCount = [
          formData.license_url,
          formData.tax_bill_url,
          formData.current_bill_url
        ].filter(Boolean).length;
        if (uploadedDocsCount < 2) {
          alert('Please upload at least two of the following documents: Property License, Tax Bill, or Current Bill.');
          return;
        }
      }

      const standardAmenities = formData.amenities.map((amenityId) => {
        const amenity = AMENITIES.find((a) => a.id === amenityId);
        if (!amenity) return null;
        return {
          id: amenity.id,
          name: amenity.name,
          icon: amenity.iconName,
          description: amenity.description,
          available: true,
        };
      }).filter((a): a is NonNullable<typeof a> => a !== null);

      const customAmenities = formData.customAmenities?.map((name, index) => ({
        id: 2000 + index, // Assign a unique ID for custom amenities
        name,
        description: 'Host added amenity',
        available: true,
        icon: 'CheckCircleIcon', // Default icon for custom amenities
      })) || [];

      const p_amenities = [...standardAmenities, ...customAmenities];
      
      const finalAmenities = p_amenities.length > 0 ? p_amenities : [{
        id: 9999,
        name: 'N/A',
        description: 'No amenities specified',
        available: true,
        icon: 'HelpCircle'
      }];
      const finalRules = formData.rules.length > 0 ? formData.rules : ['N/A'];
      const finalSafetyItems = formData.safetyItems.length > 0 ? formData.safetyItems : ['N/A'];
      const finalCancellationPolicy = formData.cancellationPolicy || 'N/A';

      if (propertyToEdit) {
        // Editing existing property — via server-side API route (bypasses client schema cache)
        const updatePayload = {
          title: String(formData.name),
          description: String(formData.description),
          price_per_night: parseFloat(String(formData.price)) || 0,
          weekend_price_per_night: parseFloat(String(formData.weekendPrice)) || 0,
          tier: String(formData.type),
          amenities: finalAmenities,
          license_url: formData.license_url || '',
          tax_bill_url: formData.tax_bill_url || '',
          current_bill_url: formData.current_bill_url || '',
          aadhar_url: formData.aadhar_url || '',
          pan_url: formData.pan_url || '',
          noc_url: formData.noc_url || '',
          image_url: formData.photo_urls[0] || '',
          images: formData.photo_urls.map((url, index) => ({ url, alt: `${formData.name} Photo ${index + 1}` })),
          cancellation_policy: finalCancellationPolicy,
          rules: finalRules,
          safety_items: finalSafetyItems,
          bedrooms: Number(formData.bedrooms) || 0,
          beds: Number(formData.beds) || 0,
          bathrooms: Number(formData.bathrooms) || 0,
          max_guests: Number(formData.maxGuests) || 0,
          area: Number(formData.area) || 0,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2,
          landmark: formData.landmark,
          district: formData.district,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          location: formData.city && formData.state ? `${formData.city}, ${formData.state}` : (formData.location || 'Unknown Location'),
          total_rooms: Number(formData.totalRooms) || 0,
          check_in_time: formData.checkInTime,
          check_out_time: formData.checkOutTime,
          latitude: formData.latitude,
          longitude: formData.longitude,
          show_specific_location: true,
          bulk_booking_discount: Number(formData.bulkBookingDiscount) || 0,
          updated_at: new Date().toISOString(),
        };

        try {
          const res = await fetch('/api/properties/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyId: propertyToEdit.id,
              hostId: hostData.id,
              updatePayload,
            }),
          });

          const json = await res.json();

          if (!res.ok || json.error) {
            console.error('Error updating property:', json.error);
            alert(`Failed to update property: ${json.error || 'Unknown error'}`);
          } else {
            setProperties((prev) =>
              prev.map((p) => (p.id === propertyToEdit.id ? (json.data as Property) : p))
            );
            fetchProperties();
          }
        } catch (err) {
          console.error('Unexpected error updating property:', err);
          alert(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        setPropertyToEdit(null);
      } else {
        // Adding new property
        try {
          const propertyPayload = {
            title: String(formData.name),
            description: String(formData.description),
            price_per_night: parseFloat(String(formData.price)) || 0,
            weekend_price_per_night: parseFloat(String(formData.weekendPrice)) || 0,
            tier: String(formData.type),
            amenities: finalAmenities,
            license_url: formData.license_url || '',
            tax_bill_url: formData.tax_bill_url || '',
            current_bill_url: formData.current_bill_url || '',
            aadhar_url: formData.aadhar_url || '',
            pan_url: formData.pan_url || '',
            noc_url: formData.noc_url || '',
            image_url: formData.photo_urls[0] || '',
            images: formData.photo_urls.map((url, index) => ({ url, alt: `${formData.name} Photo ${index + 1}` })),
            cancellation_policy: finalCancellationPolicy,
            rules: finalRules,
            safety_items: finalSafetyItems,
            bedrooms: Number(formData.bedrooms) || 0,
            beds: Number(formData.beds) || 0,
            bathrooms: Number(formData.bathrooms) || 0,
            max_guests: Number(formData.maxGuests) || 0,
            area: Number(formData.area) || 0,
            address_line1: formData.addressLine1 || '',
            address_line2: formData.addressLine2 || '',
            landmark: formData.landmark || '',
            district: formData.district || '',
            city: formData.city || '',
            state: formData.state || '',
            postal_code: formData.postalCode || '',
            country: formData.country || '',
            location: formData.city && formData.state ? `${formData.city}, ${formData.state}` : (formData.location || 'Unknown Location'),
            total_rooms: Number(formData.totalRooms) || 0,
            check_in_time: formData.checkInTime || '12:00 PM',
            check_out_time: formData.checkOutTime || '11:00 AM',
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
            show_specific_location: true,
            bulk_booking_discount: Number(formData.bulkBookingDiscount) || 0,
          };

          console.log('Sending API request to create property:', propertyPayload);
          const res = await fetch('/api/properties/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hostId: hostData.id,
              propertyPayload,
            }),
          });

          const json = await res.json();

          if (!res.ok || json.error) {
            console.error('Error creating property:', json.error);
            alert(`Error creating property: ${json.error || 'Unknown error'}`);
            return;
          }

          console.log('Property created successfully via API, ID:', json.data.id);
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
    { id: 'banking-details', label: 'Banking & KYC', icon: Banknote },
    { id: 'payout-history', label: 'Payout History', icon: Wallet },
    { id: 'unified-inbox', label: 'Unified Inbox', icon: MessageSquare },
    { id: 'aura-quality', label: 'Aura Quality', subtitle: 'AI suggestions', icon: Star },

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
    const [adminUser, setAdminUser] = useState<{ id: string; name: string } | null>(hostData.supportAdmin);

    useEffect(() => {
      if (hostData.supportAdmin) return;
      const fetchAdmin = async () => {
        const { data } = await supabase.from('users').select('id, name').eq('role', 'admin').limit(1).single();
        if (data) {
          setAdminUser({ id: data.id, name: data.name || 'Admin Support' });
        } else {
          setAdminUser({ id: '00000000-0000-0000-0000-000000000000', name: 'Admin Support' });
        }
      };
      fetchAdmin();
    }, [supabase, hostData.supportAdmin]);

    return (
      <div className="w-full space-y-3 md:space-y-8 h-[calc(100vh-140px)] flex flex-col relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 md:gap-6 bg-[#0a0a0f]/80 p-3 md:p-8 rounded-xl md:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3 md:gap-5 w-full lg:w-auto">
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0">
              <LifeBuoy size={20} className="text-indigo-400 drop-shadow-md md:hidden" />
              <LifeBuoy size={32} className="text-indigo-400 drop-shadow-md hidden md:block" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Priority Support</h1>
              <p className="text-[9px] md:text-sm font-bold text-zinc-400 mt-0.5 md:mt-1 uppercase tracking-widest flex items-center gap-2">
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Penalty Overlay (Moved to top level for maximum visibility) */}
      {isLocked && <PenaltyOverlay />}
      {isPending && <PendingApprovalOverlay />}

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
      <aside className={`fixed top-[100px] left-0 z-[95] w-72 h-[calc(100vh-100px)] bg-zinc-950 border-r border-zinc-900 flex flex-col items-center md:items-start py-6 px-4 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.8)]' : '-translate-x-full'}`}>
        <div className="flex w-full items-center justify-between mt-4 mb-6 px-4 md:hidden">
          <span className="text-sm font-black uppercase tracking-widest text-white/40">Navigation</span>
        </div>
        <div className="mb-0 px-4"></div>

        <nav className="flex-1 w-full space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isSidebarLocked = isLocked;

            // Determine the icon to render
            let renderedIcon;
            if (isSidebarLocked) {
              renderedIcon = <Lock size={22} className="text-red-500/50" />;
            } else if (item.id === 'revenue-velocity') {
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
                disabled={isSidebarLocked}
                onClick={() => {
                  if (isSidebarLocked) return;
                  setActiveTab(item.id as TabType);
                  const newParams = new URLSearchParams(searchParams.toString());
                  newParams.set('tab', item.id);
                  router.push(`?${newParams.toString()}`, { scroll: false });
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group relative ${isActive
                  ? 'bg-sky-500/10 text-sky-400'
                  : isSidebarLocked
                    ? 'text-zinc-700 cursor-not-allowed opacity-50'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
              >
                {renderedIcon}
                <span className="flex flex-col flex-1 text-left">
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  {(item as any).subtitle && (
                    <span className={`text-[10px] font-semibold tracking-widest uppercase mt-0.5 ${
                      isActive ? 'text-amber-400/80' : 'text-zinc-600 group-hover:text-zinc-400'
                    }`}>{(item as any).subtitle}</span>
                  )}
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

        <div className="px-4 sm:px-6 lg:px-10 py-6 md:py-8">
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
                <div className="bg-zinc-950/50 rounded-[1.8rem] p-4 sm:p-6">
                  {activeTab === 'overview' && (
                    <Overview
                      properties={properties}
                      bookings={hostData.bookings}
                      earnings={hostData.earnings}
                      reviews={hostData.reviews}
                      disputes={disputes}
                      onAction={handleAction}
                    />
                  )}
                  {activeTab === 'properties' && (
                    <Properties
                      properties={properties}
                      bookings={hostData.bookings}
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
                      onDelete={async (id: string) => {
                        try {
                          const res = await deleteProperty(id);
                          if (res.success) {
                            setProperties((p) => p.filter((x) => x.id !== id));
                            toast.success('Property terminated successfully.');
                          } else {
                            toast.error('Failed to terminate property: ' + res.error);
                          }
                        } catch (err: any) {
                          toast.error('An unexpected error occurred during termination.');
                        }
                      }}

                      onToggleStatus={async (id: string, newStatus: 'active' | 'pending' | 'rejected' | 'offline') => {
                        try {
                          const { error } = await supabase.rpc('toggle_property_status', {
                            p_id: id,
                            p_status: newStatus,
                          });

                          if (error) {
                            console.error('Error toggling status:', error);
                            alert('An unexpected error occurred. Please try again later.');
                            return;
                          }

                          // Optimistic update successful
                          setProperties((p) =>
                            p.map((x) => (x.id === id ? ({ ...x, status: newStatus } as Property) : x))
                          );
                        } catch (err) {
                          console.error('Unexpected error toggling status:', err);
                          alert('An unexpected error occurred');
                        }
                      }}
                    />
                  )}
                  {activeTab === 'bookings' && (
                    <Bookings bookings={hostData.bookings} searchTerm={bookingSearchTerm} setSearchTerm={setBookingSearchTerm} onAction={handleAction} />
                  )}
                  {activeTab === 'earnings' && <Earnings earnings={hostData.transactions} />}
                  {activeTab === 'occupancy-pulse' && <OccupancyPulse bookings={hostData.bookings} />}
                  {activeTab === 'revenue-velocity' && <RevenueForecasting bookings={hostData.bookings} />}
                  {activeTab === 'unified-inbox' && <UnifiedInbox inboxContext={inboxContext} />}
                  {activeTab === 'aura-quality' && <AuraQualityScore properties={properties} />}
                  {activeTab === 'amenity-upsell' && <DynamicAmenityUpsell />}
                  {activeTab === 'cleaning-maintenance' && <CleaningMaintenanceLog properties={properties} />}
                  {activeTab === 'disputes' && <DisputesList disputes={disputes} isLoading={isLoadingDisputes} />}
                  {activeTab === 'availability' && <AvailabilityCalendar properties={properties} />}

                  {activeTab === 'banking-details' && <BankingDetails />}
                  {activeTab === 'payout-history' && <PayoutHistory hostId={hostData.id} />}
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
                      gender={gender}
                      onUpdateHostName={setHostName}
                      onUpdateHostEmail={setHostEmail}
                      onUpdateHostPhoto={setHostPhotoUrl}
                      onUpdatePhoneNumber={setPhoneNumber}
                      onUpdateAddress={setAddress}
                      onUpdateBio={setBio}
                      onUpdateGender={setGender}
                      onSaveProfile={handleUpdateProfile}
                      onAvatarUpload={handleAvatarUpload}
                      isSaving={isSavingProfile}
                      cancellationCount={hostData.cancellation_count}
                      referralCode={hostData.referral_code}
                      referralBenefitCount={hostData.referral_benefit_count}
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

