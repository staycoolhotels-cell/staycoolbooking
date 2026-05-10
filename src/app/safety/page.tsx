'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import ContactHostModal from '@/components/ui/ContactHostModal';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const SafetyPage = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [adminUser, setAdminUser] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        const fetchAdmin = async () => {
            const { data } = await supabase
                .from('users')
                .select('id, name')
                .eq('role', 'admin')
                .limit(1)
                .maybeSingle();

            if (data) {
                setAdminUser(data);
            }
        };
        fetchAdmin();
    }, []);
    const sections = [
        {
            title: '1. Secure Identity Verification',
            content: 'We use advanced AI-driven identity verification to ensure every host and guest is who they say they are. This includes government ID checks, facial recognition, and background screening where permitted by law.',
            icon: 'UserCheckIcon'
        },
        {
            title: '2. Property Safety Standards',
            content: (
                <div className="space-y-4">
                    <p className="text-zinc-400">Every property on StayCool must meet our rigorous safety checklist before being listed:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {[
                            'Functional Smoke & CO Detectors',
                            'Emergency Exit Signage',
                            'First Aid Kit Availability',
                            'Secure Smart Lock Entry',
                            'Verified Property Photos',
                            'Verified Emergency Contacts'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/30">
                                <Icon name="CheckCircleIcon" size={16} className="text-sky-400" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            ),
            icon: 'HomeIcon'
        },
        {
            title: '3. 24/7 Global Support',
            content: 'Our dedicated Safety & Trust team is available around the clock to handle emergencies, report incidents, or provide immediate assistance during your stay. We prioritize safety-related inquiries above all others.',
            icon: 'PhoneCallIcon'
        },
        {
            title: '4. Secure Payments & Fraud Protection',
            content: 'All transactions are encrypted and processed through our secure payment gateway. We hold payments in escrow until 24 hours after check-in to ensure the property matches the listing and everything is as promised.',
            icon: 'ShieldCheckIcon'
        },
        {
            title: '5. Guest & Host Insurance',
            content: 'StayCool provides comprehensive ₹1M liability insurance for every booking, covering accidental damage to the property and personal injury protection for guests. Peace of mind is built into every stay.',
            icon: 'BriefcaseIcon'
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
                            Safety & <span className="text-sky-400">Trust Center</span>
                        </h1>
                    </div>

                    <p className="font-sans text-zinc-500 mb-12 text-lg">
                        Last updated: March 1, 2026
                    </p>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-zinc-400 mb-16 leading-relaxed italic text-lg border-l-4 border-sky-500/30 pl-6 py-2">
                            At StayCool, your safety is our highest priority. We’ve built a comprehensive safety framework that combines advanced technology with 24/7 human support to ensure every journey is secure.
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
                            <h3 className="text-2xl font-bold font-heading text-white mb-4">Emergency Support?</h3>
                            <p className="font-sans text-zinc-500 mb-8 max-w-xl mx-auto">
                                If you are in an immediate emergency, please contact local authorities first. Our 24/7 Safety Team is here to help immediately after.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => {
                                        if (adminUser) {
                                            setIsChatOpen(true);
                                        } else {
                                            toast.error('Safety team chat is currently unavailable. Please call +1-800-782-9266');
                                        }
                                    }}
                                    className="px-8 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold rounded-xl transition-all border border-red-500/30 min-w-[200px] flex items-center justify-center gap-2"
                                >
                                    <Icon name="PhoneIcon" size={20} />
                                    Emergency Line
                                </button>
                                <a
                                    href="/contact"
                                    className="px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sky-900/20 min-w-[200px]"
                                >
                                    Report an Issue
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
            {adminUser && (
                <ContactHostModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    hostId={adminUser.id}
                    hostName="StayCool Safety Team"
                />
            )}
        </div>
    );
};

export default SafetyPage;
