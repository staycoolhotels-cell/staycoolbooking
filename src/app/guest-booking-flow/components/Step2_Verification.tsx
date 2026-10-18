'use client';

import React, { useState } from 'react';
import { verifyUser } from '@/lib/booking-actions';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
  verificationData: { fullName: string; phone: string; documentFile?: File | null };
  setVerificationData: React.Dispatch<React.SetStateAction<{ fullName: string; phone: string; documentFile?: File | null }>>;
}

const Step2_Verification = ({ onNext, onBack, verificationData, setVerificationData }: Step2Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedName = (verificationData.fullName || '').trim();
    if (!trimmedName) {
      setError('Please fill out your Full Name to proceed.');
      return;
    }

    const cleanPhone = (verificationData.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Direct update to supabase user profile and auth user_metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await Promise.allSettled([
          supabase
            .from('users')
            .update({ name: trimmedName, phone: cleanPhone })
            .eq('id', user.id),
          supabase.auth.updateUser({
            data: { name: trimmedName, full_name: trimmedName, phone: cleanPhone }
          })
        ]);
      }

      // 2. Trigger server action in background for verifications log
      const formData = new FormData();
      formData.append('fullName', trimmedName);
      formData.append('phone', cleanPhone);
      verifyUser(undefined, formData).catch(() => {});
    } catch (err: any) {
      console.warn('Profile save note:', err);
    } finally {
      setLoading(false);
      onNext();
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-xl shadow-brand-md max-w-2xl mx-auto bg-card/50 backdrop-blur-md border border-brand-energetic/20">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary text-center mb-4">
        Identity Verification
      </h2>
      <form 
        onSubmit={handleSubmit} 
        method="POST"
        className="space-y-4"
        noValidate
      >
        <div>
          <label
            className="block text-sm font-semibold text-text-secondary mb-1"
            htmlFor="fullName"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={verificationData.fullName}
            onChange={(e) => setVerificationData({ ...verificationData, fullName: e.target.value })}
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow"
            placeholder="Full Name (as on ID)"
            required
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold text-text-secondary mb-1"
            htmlFor="phone"
          >
            Mobile Number
          </label>
          <div className="flex rounded-lg overflow-hidden border border-primary/50 focus-within:ring-2 focus-within:ring-brand-energetic focus-within:border-brand-energetic transition-all bg-surface/60">
            <div className="flex items-center gap-1.5 px-3.5 bg-white/5 border-r border-primary/30 text-zinc-300 font-bold text-sm select-none shrink-0">
              <Icon name="PhoneIcon" size={15} className="text-sky-400 shrink-0" />
              <span>+91</span>
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              inputMode="numeric"
              maxLength={10}
              value={verificationData.phone || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setVerificationData({ ...verificationData, phone: val });
              }}
              className="w-full py-2.5 sm:py-3 px-3.5 text-sm sm:text-base bg-transparent text-text-primary focus:outline-none tracking-wider placeholder:text-zinc-500 font-medium"
              placeholder="Enter 10-digit mobile number"
              required
            />
          </div>
        </div>

        <p className="text-xs text-text-secondary text-center pt-1">
          We use this mobile number for booking confirmations, SMS alerts, and check-in coordination.
        </p>

        {/* Trust Indicators */}
        <div className="flex justify-center gap-6 mt-4 opacity-60">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-tighter">
            <Icon name="ShieldCheckIcon" size={12} />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-tighter">
            <Icon name="LockClosedIcon" size={12} />
            <span>Private Data</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-tighter">
            <Icon name="CheckBadgeIcon" size={12} />
            <span>Verified Contact</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-muted/60 text-text-primary rounded-lg font-semibold disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin h-5 w-5" />}
            <span className="whitespace-nowrap">{loading ? 'Please wait...' : 'Proceed to Payment'}</span>
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 mt-4 text-center text-sm">{error}</p>}
    </div>
  );
};

export default Step2_Verification;
