'use client';

import React, { useState, startTransition } from 'react';
import { verifyUser } from '@/lib/booking-actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
}

const Step2_Verification = ({ onNext, onBack }: Step2Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      startTransition(async () => {
        const result = await verifyUser(undefined, formData);
        
        if (result.redirect) {
          router.push(result.redirect);
          return;
        }

        if (result.success) {
          onNext();
        } else {
          setError(result.error || 'Verification failed. Please check your inputs.');
        }
        setLoading(false);
      });
    } catch (err: any) {
      console.error('Verification Error:', err);
      setError(`An error occurred: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-xl shadow-brand-md max-w-2xl mx-auto bg-card/50 backdrop-blur-md border border-brand-energetic/20">
      <h2 className="text-2xl font-bold text-text-primary text-center mb-6">
        Identity Verification
      </h2>
      <form 
        onSubmit={handleSubmit} 
        method="POST"
        encType="multipart/form-data"
        className="space-y-4"
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
            required
            className="w-full p-3 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow"
            placeholder="As it appears on your ID"
          />
        </div>
        <div>
          <label
            className="block text-sm font-semibold text-text-secondary mb-1"
            htmlFor="document"
          >
            ID Document
          </label>
          <input
            type="file"
            id="document"
            name="document"
            required
            className="w-full p-3 bg-surface/60 text-text-primary rounded-lg border border-primary/50 focus:outline-none focus:ring-2 focus:ring-brand-energetic hover:shadow-sm transition-shadow"
          />
        </div>
        <p className="text-xs text-text-secondary text-center">
          We use a secure third-party service to verify your identity. Your data is safe with us.
        </p>
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-6 py-3 bg-muted/60 text-text-primary rounded-lg font-semibold disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin h-5 w-5" />}
            {loading ? 'Verifying...' : 'Proceed to Payment'}
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 mt-4 text-center text-sm">{error}</p>}
    </div>
  );
};

export default Step2_Verification;
