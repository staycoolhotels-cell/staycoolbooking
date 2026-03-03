'use client';

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { verifyUser } from '@/lib/booking-actions';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-primary text-white rounded-lg font-semibold"
    >
      {pending ? 'Submitting...' : 'Proceed to Payment'}
    </button>
  );
};

const Step2_Verification = ({ onNext, onBack }: Step2Props) => {
  const [state, dispatch] = useActionState(verifyUser, undefined);

  React.useEffect(() => {
    if (state?.success) {
      onNext();
    }
  }, [state, onNext]);

  return (
    <div className="p-8 rounded-xl shadow-brand-md max-w-2xl mx-auto bg-card/50 backdrop-blur-md border border-brand-energetic/20">
      <h2 className="text-2xl font-bold text-text-primary text-center mb-6">
        Identity Verification
      </h2>
      <form action={dispatch} className="space-y-4">
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
            className="px-6 py-3 bg-muted/60 text-text-primary rounded-lg font-semibold"
          >
            Back
          </button>
          <SubmitButton />
        </div>
      </form>
      {state?.error && <p className="text-red-500 mt-4">{state.error}</p>}
    </div>
  );
};

export default Step2_Verification;
