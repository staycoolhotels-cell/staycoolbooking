'use client';

import React from 'react';
import { Button } from '@mui/material';
import Icon from '@/components/ui/AppIcon';

const BecomeHostCTA = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-[#0a0a0a] to-zinc-900 z-0"></div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-md rounded-3xl p-12 md:p-16 text-center shadow-2xl overflow-hidden relative">

                    {/* Subtle Grid Pattern Overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    ></div>

                    <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
                        Unlock the Potential of Your Home
                    </h2>
                    <p className="font-sans text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
                        Join thousands of hosts earning extra income by listing their properties.
                        It's simple, secure, and we're here to help you every step of the way.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button className="px-8 py-4 bg-sky-500 text-white rounded-full font-bold text-lg hover:bg-sky-600 transition-all shadow-lg hover:shadow-sky-500/25 transform hover:scale-105 flex items-center">
                            <span>List Your Property</span>
                            <Icon name="ArrowRightIcon" size={20} className="ml-2" />
                        </button>

                        <button className="px-8 py-4 bg-zinc-800/50 text-zinc-300 border border-zinc-700 rounded-full font-bold text-lg hover:bg-zinc-800 hover:text-white transition-all transform hover:scale-105">
                            Learn How it Works
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BecomeHostCTA;
