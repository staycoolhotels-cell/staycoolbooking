'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

const stats = [
  { value: '50K+', label: 'Active Hosts' },
  { value: '2M+', label: 'Happy Guests' },
  { value: '4.9★', label: 'Avg. Rating' },
];

const values = [
  {
    icon: 'ShieldCheckIcon',
    title: 'Trust First',
    description: 'Every host and guest is verified. Every property is vetted. We don\'t compromise on who we welcome into the StayCool community.',
  },
  {
    icon: 'SparklesIcon',
    title: 'Extraordinary Stays',
    description: 'We curate properties with soul—places that tell a story. Not just a bed for the night, but a memory that lasts a lifetime.',
  },
  {
    icon: 'HeartIcon',
    title: 'Genuine Hospitality',
    description: 'We believe the best stays come from human connection. StayCool is built to foster warmth between hosts and guests everywhere.',
  },
  {
    icon: 'TrendingUpIcon',
    title: 'Empowering Hosts',
    description: 'We give our hosts best-in-class tools, fair pricing, and a supportive community to help them build thriving hosting businesses.',
  },
];

const team = [
  {
    name: 'Aria Chen',
    role: 'CEO & Co-Founder',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600',
  },
  {
    name: 'Marcus Osei',
    role: 'Chief Product Officer',
    src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600',
  },
  {
    name: 'Sofia Rivera',
    role: 'Head of Curation',
    src: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600',
  },
  {
    name: 'Liam Nakamura',
    role: 'CTO',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600',
  },
];

const milestones = [
  { year: '2020', event: 'StayCool is founded in Singapore with a vision to reimagine exclusive short-term stays.' },
  { year: '2021', event: 'Launched in 15 countries with 500+ verified properties and 10,000 early guests.' },
  { year: '2022', event: 'Introduced the Host Success Hub and hit ₹1Cr in host payouts.' },
  { year: '2023', event: 'Expanded to 80+ countries. Launched Safety & Trust Center and the SuperHost program.' },
  { year: '2024', event: 'Reached 50,000 active hosts and 2 million happy guests worldwide.' },
  { year: '2026', event: 'Introducing AI-powered personalized booking and expanding concierge services globally.' },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: 'easeOut' },
  viewport: { once: true },
};

export default function AboutUsPage() {
  return (
    <div className="bg-[#080808] text-zinc-300 overflow-x-hidden">

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-sky-500/5 blur-[200px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[180px] rounded-full" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-8"
          >
            Our Story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="font-heading text-5xl md:text-8xl font-black text-white leading-none mb-8"
          >
            We Reimagined <br />
            <span className="text-sky-400">How the World Stays.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-xl text-zinc-500 max-w-3xl mx-auto leading-relaxed"
          >
            StayCool Booking was born from the belief that every journey deserves a stay as remarkable as the destination itself. We connect passionate hosts with curious guests, creating moments that transcend the ordinary.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 md:px-20 pb-24">
        <motion.div
          {...fadeUp}
          className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800/30 rounded-3xl overflow-hidden border border-zinc-800/50"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-12 bg-[#080808]">
              <span className="font-heading text-5xl font-black text-white mb-2">{stat.value}</span>
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Mission */}
      <section className="px-6 md:px-20 py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp}>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-6">Our Mission</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
              To make exceptional stays accessible to every traveler on Earth.
            </h2>
            <p className="text-zinc-500 leading-relaxed text-lg">
              We started with a simple frustration: booking a truly special place to stay was either impossible or impossibly expensive. We changed that. Today, StayCool is the world's most curated marketplace for premium short-term stays—where quality is guaranteed, not hoped for.
            </p>
          </motion.div>
          <motion.div
            {...fadeUp}
            className="relative h-[480px] rounded-3xl overflow-hidden"
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
      <section className="px-6 md:px-20 py-24 bg-zinc-900/10">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-4">What We Stand For</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">Our Core Values</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl hover:border-sky-500/20 transition-all group"
              >
                <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-sky-500/20 transition-colors">
                  <Icon name={value.icon} size={24} className="text-sky-400" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 md:px-20 py-24 max-w-4xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-20">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-4">The Journey</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">Our Story So Far</h2>
        </motion.div>
        <div className="relative">
          <div className="absolute left-[7px] top-0 bottom-0 w-px bg-zinc-800" />
          <div className="space-y-12">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex gap-8"
              >
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-sky-500 border-2 border-sky-300/30 shadow-lg shadow-sky-500/30 mt-1" />
                </div>
                <div className="pb-4">
                  <span className="text-xs font-black text-sky-400 uppercase tracking-widest">{m.year}</span>
                  <p className="text-zinc-400 mt-1 leading-relaxed">{m.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 md:px-20 py-24 bg-zinc-900/10">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-4">The People</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">Meet Our Visionaries</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative h-64 mb-4 rounded-2xl overflow-hidden">
                  <AppImage
                    src={member.src}
                    alt={member.name}
                    fill={true}
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-heading font-bold text-white text-lg">{member.name}</h3>
                <p className="text-sm text-zinc-500">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-20 py-24">
        <motion.div
          {...fadeUp}
          className="max-w-4xl mx-auto text-center p-16 bg-gradient-to-br from-zinc-900 to-[#080808] rounded-[3rem] border border-zinc-800 relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-56 bg-sky-500/5 blur-[120px] rounded-full" />
          <div className="relative z-10">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to find your <span className="text-sky-400">perfect stay?</span>
            </h2>
            <p className="text-zinc-500 text-lg mb-10 max-w-xl mx-auto">
              Join millions of travelers who've discovered what makes a stay truly extraordinary.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/homepage" className="px-10 py-5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-sky-900/40">
                Explore Stays
              </a>
              <a href="/host-dashboard" className="px-10 py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl border border-zinc-700 transition-all hover:scale-105">
                Become a Host
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
