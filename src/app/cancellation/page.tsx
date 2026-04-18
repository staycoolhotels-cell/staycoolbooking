'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

const CancellationPolicyPage = () => {
    const sections = [
        {
            title: '1. Strong Cancellation Policy Overview',
            content: 'StayCool Booking implements a "Strong" cancellation policy to ensure commitment from guests and provide security for hosts. This policy applies to all bookings unless otherwise specified by a local legal requirement or a specific host-negotiated agreement.',
            icon: 'ShieldCheckIcon'
        },
        {
            title: '2. Tiered Refund Schedule',
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-400">Our refund schedule is strictly enforced based on the time remaining before the scheduled check-in (local time of the property):</p>
                    <div className="grid gap-4 mt-6">
                        {[
                            { period: '7 Days Before', refund: '100% Refund', detail: 'Guest cancel chesthe 100% refund guest ki return avuthundi.', color: 'text-green-400' },
                            { period: '5-7 Days Before', refund: '70% Refund', detail: 'Guest cancel chesthe 70% refund guest ki, 30% admin charge.', color: 'text-yellow-400' },
                            { period: '2-4 Days Before', refund: '30% Refund', detail: 'Guest cancel chesthe 30% refund guest ki, 70% admin charge.', color: 'text-orange-400' },
                            { period: 'Check-in day', refund: 'No Refund', detail: 'Guest same day cancel chesthe No refund guest ki. Payment split: 65% host ki, 35% admin ki.', color: 'text-red-400' }
                        ].map((item, i) => (
                            <div key={i} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">{item.period} before check-in</span>
                                    <span className={`text-xl font-bold ${item.color}`}>{item.refund}</span>
                                </div>
                                <p className="text-sm text-zinc-500 md:max-w-[200px]">{item.detail}</p>
                            </div>
                        ))}
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
                                <a
                                    href="/help"
                                    className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 border border-zinc-700 min-w-[200px]"
                                >
                                    Help Center
                                </a>
                                <a
                                    href="mailto:support@staycoolbooking.com"
                                    className="px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sky-900/20 min-w-[200px]"
                                >
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CancellationPolicyPage;
