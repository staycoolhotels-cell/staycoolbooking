'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingCart, setBookingCart] = useState<Property[]>([]);
  const [filters, setFilters] = useState({
    location: '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: Number(searchParams.get('guests')) || 1,
    bookingType: searchParams.get('bookingType') || 'single',
    roomCount: Number(searchParams.get('roomCount')) || 1,
    amenities: searchParams.get('amenities') || '{}',
    selectedRoomIds: searchParams.get('selectedRoomIds') || '[]',
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="relative min-h-screen w-full overflow-hidden text-slate-300 font-sans">
        {/* 2. COMPACT FLOATING SLATE */}
        <main className="relative z-10 w-full max-w-4xl mx-auto pt-32 pb-24 px-4 md:px-0">
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
                {/* Integrated Stepper (Header of the Card) */}
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400/60">
                      Step 0{currentStep}
                    </span>
                    <h2 className="text-sm font-bold text-white tracking-widest uppercase italic">
                      {steps[currentStep - 1]}
                    </h2>
                  </div>
                  <Stepper steps={steps} currentStep={currentStep} />
                </div>

                {/* Body - Scaled down padding */}
                <div className="p-6 md:p-10">
                  {currentStep === 1 && (
                    <Step2_Verification
                      onNext={() => setCurrentStep(2)}
                      onBack={() => {
                        if (typeof window !== 'undefined' && window.history.length > 2) {
                          router.back();
                        } else {
                          // Fallback to the property page if we have the ID
                          if (preSelectedPropertyId) {
                            router.push(`/property-listing/${preSelectedPropertyId}`);
                          } else {
                            router.push('/homepage');
                          }
                        }
                      }}
                    />
                  )}
                  {currentStep === 2 && (
                    <Step3_Payment
                      bookingCart={bookingCart}
                      filters={filters}
                      onNext={() => setCurrentStep(3)}
                      onBack={() => setCurrentStep(1)}
                    />
                  )}
                  {currentStep === 3 && (
                    <Step4_Confirmation 
                      latitude={(bookingCart[0] as any)?.latitude}
                      longitude={(bookingCart[0] as any)?.longitude}
                      address={bookingCart[0]?.show_specific_location 
                        ? `${bookingCart[0]?.address_line1 || ''} ${bookingCart[0]?.address_line2 || ''}, ${bookingCart[0]?.city || ''}, ${bookingCart[0]?.state || ''}`.trim()
                        : bookingCart[0]?.location
                      }
                    />
                  )}
                </div>

                {/* Footer - Inline with the card */}
                <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
                  <div>
                    {currentStep > 1 && currentStep < 3 && (
                      <button
                        onClick={() => setCurrentStep((prev) => prev - 1)}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                      >
                        [ Back ]
                      </button>
                    )}
                  </div>

                  {currentStep < 3 && (
                    <button
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                      className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                    >
                      Next Phase
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </LocalizationProvider>
  );
};

export default GuestBookingInteractive;
