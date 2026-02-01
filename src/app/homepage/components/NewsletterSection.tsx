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
    <section className="py-20 bg-gradient-to-br from-gradient-background-from to-gradient-background-to">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-surface to-card text-foreground rounded-xl shadow-2xl p-10 md:p-12 text-center relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-10 z-0"
            style={{
              backgroundImage:
                'radial-gradient(rgba(var(--color-primary-r), var(--color-primary-g), var(--color-primary-b), 0.2) 1px, transparent 1px)',
              backgroundSize: '15px 15px',
            }}
          ></div>
          <Icon
            name="EnvelopeOpenIcon"
            size={48}
            className="mx-auto mb-6 text-accent relative z-10"
          />
          <h2 className="font-heading text-4xl font-bold tracking-tight relative z-10">
            Stay Informed & Inspired
          </h2>
          <p className="font-sans mt-4 text-text-secondary max-w-2xl mx-auto relative z-10">
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
                  className="flex-1 px-5 py-3 rounded-lg border-2 border-border focus:outline-none focus:ring-2 focus:ring-accent bg-input placeholder-text-secondary text-text-primary font-sans"
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground rounded-lg font-bold font-sans hover:opacity-90 transition-all shadow-lg transform hover:scale-105"
                >
                  Subscribe
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 flex items-center justify-center space-x-3 py-3 bg-success rounded-lg relative z-10">
              <Icon name="CheckCircleIcon" size={24} variant="solid" />
              <span className="font-sans font-semibold text-success-foreground">
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
