'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

const CancellationPolicyPage = () => {
    const sections = [
        {
            title: '1. Strong Cancellation Policy Overview',
            content: 'StayCool Booking implements a "Strong" cancellation policy to ensure commitment from guests and provide security for hosts. This policy applies to all bookings unless otherwise specified by a local legal requirement or a specific host-negotiated agreement.',
            icon: 'ShieldCheckIcon'
        },
        {
            title: '2. Cancellation & Refund Schedule',
            content: (
                <div className="space-y-8">
                    <div className="space-y-4">
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Cancellation Policy Overview:</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="bg-emerald-400/5 border border-emerald-400/20 px-6 py-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-white/[0.04]">
                                <div>
                                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-1">With Free Cancellation (₹70)</span>
                                    <span className="text-2xl font-bold text-emerald-400">100% Refund</span>
                                    <p className="text-xs text-zinc-400 mt-1">Full refund of booking amount when cancelled before check-in.</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20 shadow-inner flex-shrink-0">
                                    <Icon name="ShieldCheckIcon" size={20} className="text-emerald-400" />
                                </div>
                            </div>

                            <div className="bg-sky-400/5 border border-sky-400/20 px-6 py-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-white/[0.04]">
                                <div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Standard (Without ₹70)</span>
                                    <span className="text-2xl font-bold text-sky-400">70% Refund</span>
                                    <p className="text-xs text-zinc-400 mt-1">70% refund before check-in. 30% penalty is split 50/50 between host & admin.</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-sky-400/10 flex items-center justify-center border border-sky-400/20 shadow-inner flex-shrink-0">
                                    <Icon name="CheckIcon" size={20} className="text-sky-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Policy Details Section */}
                    <div className="p-6 bg-sky-500/5 border border-sky-500/10 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-sky-500/20 transition-colors" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-500/20">
                                    <Icon name="ShieldCheckIcon" size={16} className="text-sky-400" />
                                </div>
                                <span className="text-[11px] font-black text-sky-400 uppercase tracking-[0.2em]">Policy Breakdown</span>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        <strong className="text-zinc-100 block mb-0.5">Free Cancellation Protection (₹70)</strong>
                                        Guests who select the ₹70 Free Cancellation option receive a 100% full refund of the base booking price if cancelled before check-in. The ₹70 protection fee is retained 100% by the platform (admin) and is non-refundable.
                                    </p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        <strong className="text-zinc-100 block mb-0.5">Standard Cancellation (30% Penalty Split)</strong>
                                        If the ₹70 protection is not selected, guests receive a 70% refund of the booking price upon cancellation prior to check-in. The remaining 30% penalty is shared equally (50/50: 15% to host, 15% to platform).
                                    </p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        <strong className="text-zinc-100 block mb-0.5">StayCool No-Show Rule</strong>
                                        If the guest fails to arrive at the property on the scheduled check-in date and check-in time, it will be considered a No-Show. No refund will be provided for No-Show bookings, unless StayCool's applicable refund policy applies.
                                    </p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            ),
            icon: 'CalendarDaysIcon'
        },
        {
            title: '3. Extenuating Circumstances',
            content: 'In rare cases of documented extenuating circumstances (such as government-mandated travel restrictions, natural disasters at the destination, or severe medical emergencies), StayCool Booking may override the standard policy. Documentation will be required for any such override request.',
            icon: 'AlertCircleIcon'
        },
        {
            title: '4. Host Cancellations',
            content: 'If a host cancels a reservation, the guest will receive a 100% refund, including all service fees. Hosts who cancel frequently may be subject to penalties, including fines and potential removal from the platform.',
            icon: 'UserMinusIcon'
        },
        {
            title: '5. Non-Refundable Service Fees',
            content: 'Please note that certain administrative and service fees may be non-refundable once a booking is confirmed, depending on the payment method and jurisdiction. These will be clearly itemized during the checkout process.',
            icon: 'BanknotesIcon'
        },
        {
            title: '6. StayCool No-Show Rule',
            content: (
                <div className="space-y-4">
                    <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <p className="text-base text-zinc-100 font-medium leading-relaxed">
                            &ldquo;If the guest fails to arrive at the property on the scheduled check-in date and check-in time, it will be considered a No-Show. No refund will be provided for No-Show bookings, unless StayCool&apos;s applicable refund policy applies.&rdquo;
                        </p>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        When a guest does not check in by the property&apos;s scheduled check-in time without prior communication or a valid cancellation request, the reservation is treated as a No-Show. The room inventory is held exclusively for the guest, and no refund will be issued unless an applicable StayCool refund policy applies.
                    </p>
                </div>
            ),
            icon: 'ClockIcon'
        }
    ];

    return (
        <div className="bg-[#080808] text-zinc-300 min-h-screen pt-32 pb-20 px-6 md:px-20">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20">
                            <Icon name="ShieldCheckIcon" className="text-sky-400" size={28} />
                        </div>
                        <h1 className="font-heading text-4xl md:text-6xl font-bold text-white">
                            Cancellation & <span className="text-sky-400">Refund Policy</span>
                        </h1>
                    </div>

                    <p className="font-sans text-zinc-500 mb-12 text-lg">
                        Last updated: March 1, 2026
                    </p>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-zinc-400 mb-16 leading-relaxed italic text-lg border-l-4 border-sky-500/30 pl-6 py-2">
                            Our "Strong" cancellation policy is designed to balance the needs of both our guests and hosts, ensuring reliability and commitment in every booking.
                        </p>

                        <div className="space-y-16">
                            {sections.map((section, index) => (
                                <motion.section
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    viewport={{ once: true }}
                                    className="group"
                                >
                                    <h2 className="font-heading text-2xl font-bold text-zinc-100 mb-6 group-hover:text-sky-400 transition-colors flex items-center gap-3">
                                        {section.title}
                                    </h2>
                                    <div className="font-sans leading-relaxed text-zinc-400 bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800/50 hover:border-zinc-700/50 transition-all shadow-xl">
                                        {section.content}
                                    </div>
                                </motion.section>
                            ))}
                        </div>
                    </div>

                    <div className="mt-24 p-12 bg-gradient-to-br from-zinc-900 to-[#080808] rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>
                        <div className="relative z-10 text-center">
                            <h3 className="text-2xl font-bold font-heading text-white mb-4">Need Help with a Cancellation?</h3>
                            <p className="font-sans text-zinc-500 mb-8 max-w-xl mx-auto">
                                If you need to cancel a booking or have questions about a refund status, our support team is available 24/7.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/help"
                                    className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 border border-zinc-700 min-w-[200px]"
                                >
                                    Help Center
                                </Link>
                                <Link
                                    href="/contact"
                                    className="px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sky-900/20 min-w-[200px]"
                                >
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CancellationPolicyPage;
