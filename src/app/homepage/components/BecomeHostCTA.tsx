'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

const BecomeHostCTA = () => {
    return (
        <section className="py-32 relative overflow-hidden bg-[#050505]">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.06)_0%,transparent_70%)] pointer-events-none" />

            {/* Subtle Animated Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -left-1/4 w-[40rem] h-[40rem] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.08, 0.12, 0.08],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -bottom-1/4 -right-1/4 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"
            />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative group p-[1px] rounded-[2.5rem] overflow-hidden"
                >
                    {/* Animated Border Gradient via Pseudo-element approach */}
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-zinc-800/20 to-indigo-500/20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

                    {/* Main Inner Card */}
                    <div className="relative bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[calc(2.5rem-1px)] p-8 sm:p-12 md:p-20 text-center flex flex-col items-center justify-center border border-white/[0.05] shadow-2xl aspect-square sm:aspect-auto">

                        {/* Premium Grid Overlay */}
                        <div
                            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                            style={{
                                backgroundImage: `
                                    linear-gradient(to right, #ffffff 1px, transparent 1px),
                                    linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                                `,
                                backgroundSize: '3rem 3rem',
                            }}
                        />

                        {/* Top Accent Icon */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 20 }}
                            className="mb-8 p-5 rounded-3xl bg-gradient-to-br from-sky-500/5 to-transparent border border-sky-500/10 shadow-[0_0_40px_rgba(14,165,233,0.1)] backdrop-blur-xl relative"
                        >
                            <div className="absolute inset-0 rounded-3xl bg-sky-500/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-700" />
                            <Icon name="HomeModernIcon" size={40} className="text-sky-400 relative z-10" />
                        </motion.div>

                        {/* Title */}
                        <h2 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                                Unlock the Potential
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                                of Your Home
                            </span>
                        </h2>

                        {/* Description */}
                        <p className="font-sans text-xl md:text-2xl text-zinc-400/90 max-w-3xl mx-auto mb-14 leading-relaxed font-light">
                            Join thousands of hosts earning extra income by listing their properties.
                            It's simple, secure, and we're here to help you every step of the way.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto relative z-20">
                            <Link href="/signup?role=host" className="w-full sm:w-auto">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative group/btn w-full sm:w-auto"
                                >
                                    {/* Button Glow */}
                                    <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full blur opacity-40 group-hover/btn:opacity-80 transition duration-500" />

                                    <button className="relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-full font-semibold text-lg md:text-xl shadow-[0_0_40px_rgba(14,165,233,0.3)] transition-all flex items-center justify-center gap-3 border border-sky-400/30">
                                        <span>List Your Property</span>
                                        <Icon name="ArrowRightIcon" size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            </Link>

                            <Link href="/host-resources" className="w-full sm:w-auto">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full sm:w-auto px-10 py-5 bg-zinc-900/50 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-500 hover:text-white rounded-full font-semibold text-lg md:text-xl transition-all flex items-center justify-center backdrop-blur-sm"
                                >
                                    Learn How it Works
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default BecomeHostCTA;
