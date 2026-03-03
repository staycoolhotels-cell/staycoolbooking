'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

const items = [
    { value: '50K+', label: 'Active Hosts', icon: 'UsersIcon' },
    { value: '2M+', label: 'Happy Guests', icon: 'HeartIcon' },
    { value: '4.9★', label: 'Avg. Rating', icon: 'StarIcon' },
    { value: '₹0', label: 'Hidden Fees', icon: 'ShieldCheckIcon' },
    { value: '24/7', label: 'Support', icon: 'PhoneIcon' },
];

// Duplicate for seamless loop
const marqueeItems = [...items, ...items];

const steps = [
    {
        number: '01',
        icon: 'SearchIcon',
        title: 'Search Your Destination',
        description: 'Browse thousands of verified properties across 120+ countries. Filter by type, price, and amenities.',
    },
    {
        number: '02',
        icon: 'CalendarDaysIcon',
        title: 'Book With Confidence',
        description: 'Secure checkout, clear cancellation policies, and escrow payments. Your money is safe until check-in.',
    },
    {
        number: '03',
        icon: 'HomeIcon',
        title: 'Arrive & Enjoy',
        description: 'Check in with smart locks, enjoy your curated stay, and leave a review to help the community.',
    },
];

const HowItWorksSection = () => {
    return (
        <section className="w-full">
            {/* Animated marquee strip */}
            <div className="w-full overflow-hidden mb-20 relative">
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#080808] to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#080808] to-transparent z-10" />
                <motion.div
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
                    className="flex gap-6 w-max py-6"
                >
                    {marqueeItems.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-8 py-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl whitespace-nowrap flex-shrink-0"
                        >
                            <Icon name={item.icon} size={20} className="text-sky-400" />
                            <span className="font-heading text-2xl font-black text-white">{item.value}</span>
                            <span className="text-sm text-zinc-500 uppercase tracking-widest font-bold">{item.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* How It Works */}
            <div className="mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-400 font-bold mb-4">Simple Process</p>
                    <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">
                        How StayCool Works
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting line (desktop only) */}
                    <div className="hidden md:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            viewport={{ once: true }}
                            className="relative flex flex-col items-center text-center p-8 bg-zinc-900/20 border border-zinc-800/40 rounded-3xl hover:border-sky-500/20 transition-all group"
                        >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black text-sky-500/40 tracking-widest uppercase font-heading">
                                {step.number}
                            </div>
                            <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mb-6 mt-4 group-hover:bg-sky-500/20 group-hover:scale-110 transition-all">
                                <Icon name={step.icon} size={28} className="text-sky-400" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-zinc-500 leading-relaxed text-sm">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
