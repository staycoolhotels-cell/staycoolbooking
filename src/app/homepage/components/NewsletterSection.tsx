'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to subscribe.');
      }

      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => {
        setIsSubscribed(false);
      }, 5000);
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-8 md:py-20 bg-[#080808]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-sm text-zinc-100 rounded-xl shadow-2xl p-6 md:p-12 text-center relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-5 z-0"
            style={{
              backgroundImage:
                'radial-gradient(#0ea5e9 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>
          <Icon
            name="EnvelopeOpenIcon"
            size={36}
            className="mx-auto mb-4 md:mb-6 text-sky-400 relative z-10 w-10 h-10 md:w-12 md:h-12"
          />
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight relative z-10 text-zinc-100">
            Stay Informed & Inspired
          </h2>
          <p className="font-sans mt-2 md:mt-4 text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto relative z-10">
            Subscribe to our newsletter for exclusive deals, travel inspiration, and the latest news
            from StayCool Booking.
          </p>
          {!isSubscribed ? (
            <form onSubmit={handleSubscribe} className="mt-6 md:mt-8 max-w-lg mx-auto relative z-10">
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address for newsletter"
                  required
                  className="flex-1 px-4 py-2.5 md:px-5 md:py-3 rounded-lg border-2 border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 bg-zinc-800 placeholder-zinc-500 text-zinc-100 font-sans text-sm md:text-base"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 md:px-8 md:py-3 bg-sky-500 text-white rounded-lg font-bold font-sans text-sm md:text-base hover:bg-sky-600 transition-all shadow-lg hover:shadow-sky-500/20 transform hover:scale-105 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 flex items-center justify-center space-x-3 py-3 bg-green-500/10 border border-green-500/20 rounded-lg relative z-10">
              <Icon name="CheckCircleIcon" size={24} variant="solid" className="text-green-400" />
              <span className="font-sans font-semibold text-green-400">
                Thank you for subscribing!
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
