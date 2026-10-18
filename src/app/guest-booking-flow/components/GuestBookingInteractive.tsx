'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Stepper from './Stepper';
import Step2_Verification from './Step2_Verification';
import Step3_Payment from './Step3_Payment';
import Step4_Confirmation from './Step4_Confirmation';
import { supabase } from '@/lib/supabaseClient';
import { Property } from '@/lib/types';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const GuestBookingInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPropertyId = searchParams.get('propertyId');
  const [currentStep, setCurrentStep] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);

  // Guests may start a reservation before logging in. Login is intentionally
  // the first booking step, so the selected property and dates are retained.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setCurrentStep(user ? 1 : 0);
      setCheckingSession(false);
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setVerificationData(prev => ({
            ...prev,
            fullName: prev.fullName || profile.name || user.user_metadata?.name || '',
            phone: prev.phone || profile.phone || user.user_metadata?.phone || ''
          }));
        } else if (user.user_metadata?.name || user.user_metadata?.phone) {
          setVerificationData(prev => ({
            ...prev,
            fullName: prev.fullName || user.user_metadata?.name || '',
            phone: prev.phone || user.user_metadata?.phone || ''
          }));
        }
      }
    });
  }, []);

  // Handle browser/system back button
  useEffect(() => {
    // Push a history state for the current step so back button can be intercepted
    history.pushState({ step: currentStep }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (currentStep === 1) {
        // Step 1 → go to property page or previous page
        if (preSelectedPropertyId) {
          router.push(`/property-listing/${preSelectedPropertyId}`);
        } else {
          router.back();
        }
      } else {
        // Step 2 or 3 → go to previous step
        setCurrentStep(prev => prev - 1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentStep, preSelectedPropertyId]);

  const [bookingCart, setBookingCart] = useState<Property[]>([]);
  const [filters] = useState({
    location: '',
    checkIn: searchParams.get('checkIn') || '',

    checkOut: searchParams.get('checkOut') || '',
    guests: Number(searchParams.get('guests')) || 1,
    bookingType: searchParams.get('bookingType') || 'single',
    roomCount: Number(searchParams.get('roomCount')) || 1,
    selectedRoomType: searchParams.get('selectedRoomType') || '',
    amenities: searchParams.get('amenities') || '{}',
    selectedRoomIds: searchParams.get('selectedRoomIds') || '[]',
    hasFreeCancellation: searchParams.get('hasFreeCancellation') === 'true',
    freeCancellationFee: Number(searchParams.get('freeCancellationFee')) || 0,
  });

  const [verificationData, setVerificationData] = useState<{
    fullName: string;
    phone: string;
    documentFile?: File | null;
  }>({
    fullName: '',
    phone: '',
    documentFile: null
  });


  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoadingProperties(true);
    const { data, error } = await supabase.from('properties').select('*');
    if (!error && data) {
      const mappedProperties: Property[] = data.map((item: any) => ({
        ...item,
        instantBook: item.instant_book,
      }));
      setProperties(mappedProperties);
    }
    setLoadingProperties(false);
  };

  useEffect(() => {
    if (!loadingProperties && preSelectedPropertyId && properties.length > 0) {
      const selectedProperty = properties.find(p => p.id === preSelectedPropertyId);
      if (selectedProperty) {
        setBookingCart([selectedProperty]);
      }
    }
  }, [loadingProperties, preSelectedPropertyId, properties]);

  const steps = ['Identity', 'Payment', 'Finish'];

  const startLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/auth?${new URLSearchParams({ role: 'guest', returnTo }).toString()}`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="relative min-h-[100dvh] w-full overflow-hidden text-slate-300 font-sans flex flex-col bg-[#0a0a0f]">
        {/* Background elements - Enhanced for full screen immersion */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-sky-600/20 blur-[140px] rounded-full animate-pulse" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-purple-600/20 blur-[140px] rounded-full animate-pulse [animation-duration:4000ms]" />
          <div className="absolute top-[25%] right-[5%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse [animation-duration:3000ms]" />
          <div className="absolute bottom-[25%] left-[5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse [animation-duration:5000ms]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full" />
        </div>

        {/* 2. COMPACT FLOATING SLATE */}
        <main className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-start md:justify-center pt-24 pb-6 sm:pt-32 sm:pb-10 px-4 md:px-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
            >
              {/* SLENDER CONTAINER */}
              <div className="relative border border-white/5 bg-white/[0.02] backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                {checkingSession ? (
                  <div className="flex min-h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" /></div>
                ) : currentStep === 0 ? (
                  <div className="grid gap-8 p-6 md:grid-cols-[1fr_320px] md:p-10">
                    <div>
                      <button onClick={() => router.push(preSelectedPropertyId ? `/property-listing/${preSelectedPropertyId}` : '/')} className="mb-7 text-sm font-semibold text-zinc-400 hover:text-white">← Back</button>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-400">Request to book</p>
                      <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">Complete your booking</h1>
                      <div className="mt-8 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div><p className="font-bold text-white">1. Log in or sign up</p><p className="mt-1 text-sm text-zinc-400">Sign in to continue with your reservation.</p></div>
                          <button onClick={startLogin} className="shrink-0 rounded-xl bg-sky-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-sky-400">Continue</button>
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl border border-white/10 p-5 text-zinc-500"><p className="font-bold">2. Add a payment method</p></div>
                      <div className="mt-4 rounded-2xl border border-white/10 p-5 text-zinc-500"><p className="font-bold">3. Review your request</p></div>
                    </div>
                    <aside className="h-fit rounded-2xl border border-white/10 bg-black/20 p-5">
                      {bookingCart[0]?.images?.[0]?.url && <img src={bookingCart[0].images[0].url} alt="Selected property" className="mb-4 h-32 w-full rounded-xl object-cover" />}
                      <h2 className="font-black text-white">{bookingCart[0]?.title || bookingCart[0]?.name || 'Your selected stay'}</h2>
                      <p className="mt-2 text-sm text-zinc-400">{filters.checkIn || 'Select dates'} {filters.checkOut ? `– ${filters.checkOut}` : ''}</p>
                      <p className="mt-1 text-sm text-zinc-400">{filters.guests} guest{filters.guests === 1 ? '' : 's'}</p>
                    </aside>
                  </div>
                ) : <>
                  {/* Integrated Stepper (Header of the Card) */}
                  <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400/60">Step 0{currentStep}</span>
                      <h2 className="text-sm font-bold text-white tracking-widest uppercase italic">{steps[currentStep - 1]}</h2>
                    </div>
                    <Stepper steps={steps} currentStep={currentStep} />
                  </div>

                  <div className="p-3 sm:p-5 md:p-8">
                    {currentStep === 1 && (
                    <Step2_Verification
                      verificationData={verificationData}
                      setVerificationData={setVerificationData}
                      onNext={() => setCurrentStep(2)}
                      onBack={() => {
                        if (preSelectedPropertyId) {
                          router.push(`/property-listing/${preSelectedPropertyId}`);
                        } else {
                          router.back();
                        }
                      }}
                    />
                    )}
                    {currentStep === 2 && (
                    <Step3_Payment
                      bookingCart={bookingCart}
                      filters={filters}
                      verificationData={verificationData}
                      onNext={() => setCurrentStep(3)}
                      onBack={() => setCurrentStep(1)}
                    />
                    )}
                    {currentStep === 3 && (
                    <Step4_Confirmation 
                      latitude={bookingCart[0]?.latitude}
                      longitude={bookingCart[0]?.longitude}
                      address={bookingCart[0]?.show_specific_location 
                        ? `${bookingCart[0]?.address_line1 || ''} ${bookingCart[0]?.address_line2 || ''}, ${bookingCart[0]?.city || ''}, ${bookingCart[0]?.state || ''}`.trim()
                        : bookingCart[0]?.location
                      }
                    />
                    )}
                  </div>
                </>}

                {/* Footer removed */}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </LocalizationProvider>
  );
};

export default GuestBookingInteractive;
