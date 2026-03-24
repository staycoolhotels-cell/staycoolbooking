'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

// Removed placeholder stats

const values = [
  {
    icon: 'CurrencyDollarIcon',
    title: 'Lower commission for hosts',
    description: 'We believe hosts should keep more of what they earn. Our low commission structure helps you grow your hosting business sustainably.',
  },
  {
    icon: 'TicketIcon',
    title: 'Better prices for guests',
    description: 'By reducing overhead, we pass the savings directly to you. Enjoy premium stays at prices that make sense.',
  },
  {
    icon: 'ArrowPathIcon',
    title: 'Faster and transparent payouts',
    description: 'No more waiting weeks for your money. Stay Cool ensures hosts get paid quickly and transparently after every stay.',
  },
  {
    icon: 'ShieldCheckIcon',
    title: 'Verified and trusted stays',
    description: 'Trust is our foundation. Every property and user is verified to ensure a safe and reliable experience for everyone.',
  },
];

// Removed placeholder team and milestones

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: 'easeOut' as const },
  viewport: { once: true },
};

export default function AboutUsPage() {
  return (
    <div className="bg-[#080808] text-zinc-300 overflow-x-hidden">

      {/* Hero */}
      <section className="relative flex flex-col items-center px-4 sm:px-6 pt-14 sm:pt-20 pb-14 sm:pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-sky-500/5 blur-[200px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-indigo-500/5 blur-[180px] rounded-full" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-5 sm:mb-8"
          >
            Our Story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="font-heading text-5xl sm:text-7xl md:text-9xl font-black text-white leading-none mb-5 sm:mb-8"
          >
            Stay <span className="text-sky-400">Cool</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-xl sm:text-2xl md:text-3xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium mb-5 sm:mb-8"
          >
            Smart stays. Fair prices. Faster payouts.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed px-2"
          >
            We began with a simple but powerful idea: that travel should be rewarding for everyone involved. 
            In an industry often clouded by high fees and complex processes, Stay Cool stands for clarity and fairness. 
            We are building a community where hosts are empowered and guests are valued, one stay at a time.
          </motion.p>
        </div>
      </section>

      {/* Stats section removed for authenticity */}

      {/* Mission */}
      <section className="px-4 sm:px-6 md:px-20 py-14 sm:py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div {...fadeUp}>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-4 sm:mb-6">Our Mission</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 sm:mb-8 leading-tight">
              Fixing real problems in tourism and hospitality.
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <p className="text-zinc-500 leading-relaxed text-base sm:text-lg">
                We are building Stay Cool to fix real problems in the tourism and hospitality industry. Today, booking platforms charge high commissions on verified stays. Guests end up paying more, and hosts face delayed payouts.
              </p>
              <p className="text-zinc-400 leading-relaxed text-base sm:text-lg font-medium italic border-l-2 border-sky-500 pl-4 sm:pl-6">
                Stay Cool changes that. Our goal is simple—create a fair, efficient, and reliable platform for both guests and hosts.
              </p>
            </div>
          </motion.div>
          <motion.div
            {...fadeUp}
            className="relative h-[280px] sm:h-[380px] md:h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden"
          >
            <AppImage
              src="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1974&auto=format&fit=crop"
              alt="Luxury poolside stay"
              fill={true}
              objectFit="cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 sm:px-6 md:px-20 py-14 sm:py-24 bg-zinc-900/10">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-8 sm:mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-3 sm:mb-4">What We Stand For</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white">Our Core Values</h2>
          </motion.div>

          {/* Mobile: single column list-style | Desktop: 2-column grid */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-4 sm:p-7 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl hover:border-sky-500/25 hover:bg-zinc-900/60 transition-all duration-300 group"
              >
                {/* Icon — always visible on left */}
                <div className="flex-shrink-0 w-11 h-11 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                  <Icon name={value.icon} size={20} className="text-sky-400" />
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <h3 className="font-heading text-base sm:text-lg font-bold text-white mb-1 sm:mb-2 leading-snug">
                    {value.title}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values section ends here */}

      {/* Meet the Team */}
      <section className="px-4 sm:px-6 md:px-20 py-14 sm:py-24 max-w-7xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-10 sm:mb-20">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-3 sm:mb-4">The People Behind Stay Cool</p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white">Meet the Team</h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-5 sm:gap-10 max-w-2xl mx-auto">
          {/* Team Member 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center group"
          >
            <div className="relative w-full aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden mb-4 sm:mb-6 border border-zinc-800/50 shadow-2xl shadow-black/60 group-hover:border-sky-500/30 transition-all duration-500">
              <AppImage
                src="/assets/images/team-member-1.JPG"
                alt="Co-founder"
                fill={true}
                objectFit="cover"
                style={{ objectPosition: 'center top' }}
              />
            </div>
            <h3 className="font-heading text-lg sm:text-2xl font-bold text-white mb-1">Mr. Raju</h3>
            <p className="text-sky-400 text-xs sm:text-sm font-medium tracking-wider uppercase mb-2 sm:mb-3">Founder</p>
            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
              Passionate about creating fair and transparent experiences for both hosts and guests.
            </p>
          </motion.div>

          {/* Team Member 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center group"
          >
            <div className="relative w-full aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden mb-4 sm:mb-6 border border-zinc-800/50 shadow-2xl shadow-black/60 group-hover:border-sky-500/30 transition-all duration-500">
              <AppImage
                src="/assets/images/team-member-2.JPG"
                alt="Co-founder"
                fill={true}
                objectFit="cover"
                style={{ objectPosition: 'center top' }}
              />
            </div>
            <h3 className="font-heading text-lg sm:text-2xl font-bold text-white mb-1">Mr. Suraj</h3>
            <p className="text-sky-400 text-xs sm:text-sm font-medium tracking-wider uppercase mb-2 sm:mb-3">Founder</p>
            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
              Dedicated to building a platform that empowers hosts and delivers exceptional value to every traveller.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA section follows */}

      {/* CTA */}
      <section className="px-4 sm:px-6 md:px-20 py-14 sm:py-24">
        <motion.div
          {...fadeUp}
          className="max-w-4xl mx-auto text-center p-8 sm:p-12 md:p-16 bg-gradient-to-br from-zinc-900 to-[#080808] rounded-[2rem] sm:rounded-[3rem] border border-zinc-800 relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-56 bg-sky-500/5 blur-[120px] rounded-full" />
          <div className="relative z-10">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to find your <span className="text-sky-400">perfect stay?</span>
            </h2>
            <p className="text-zinc-500 text-base sm:text-lg mb-7 sm:mb-10 max-w-xl mx-auto">
              Join millions of travelers who&apos;ve discovered what makes a stay truly extraordinary.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <a href="/homepage" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl sm:rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-sky-900/40 text-center">
                Explore Stays
              </a>
              <a href="/host-dashboard" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl sm:rounded-2xl border border-zinc-700 transition-all hover:scale-105 text-center">
                Become a Host
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
