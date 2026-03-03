'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log('Subscribing with email:', email);
      setIsSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setIsSubscribed(false);
      }, 3000);
    }
  };

  return (
    <section className="py-20 bg-[#080808]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-sm text-zinc-100 rounded-xl shadow-2xl p-10 md:p-12 text-center relative overflow-hidden">
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
            size={48}
            className="mx-auto mb-6 text-sky-400 relative z-10"
          />
          <h2 className="font-heading text-4xl font-bold tracking-tight relative z-10 text-zinc-100">
            Stay Informed & Inspired
          </h2>
          <p className="font-sans mt-4 text-zinc-400 max-w-2xl mx-auto relative z-10">
            Subscribe to our newsletter for exclusive deals, travel inspiration, and the latest news
            from StayCool Booking.
          </p>
          {!isSubscribed ? (
            <form onSubmit={handleSubscribe} className="mt-8 max-w-lg mx-auto relative z-10">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address for newsletter"
                  required
                  className="flex-1 px-5 py-3 rounded-lg border-2 border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 bg-zinc-800 placeholder-zinc-500 text-zinc-100 font-sans"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-sky-500 text-white rounded-lg font-bold font-sans hover:bg-sky-600 transition-all shadow-lg hover:shadow-sky-500/20 transform hover:scale-105"
                >
                  Subscribe
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
