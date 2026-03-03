'use client';

import React from 'react';
import { motion } from 'framer-motion';

const TermsPage = () => {
    const sections = [
        {
            title: '1. Acceptance of Terms',
            content: 'By accessing or using the StayCool Booking platform, website, or services (collectively, the "Platform"), you agree to comply with and be bound by these Terms and Conditions ("Terms"). These Terms constitute a legally binding agreement between you and StayCool Booking regarding your access to and use of the Platform.',
        },
        {
            title: '2. User Verification and Identity',
            content: 'User verification on the Internet is difficult and we do not assume any responsibility for the confirmation of any Member’s identity. Notwithstanding the above, for transparency and fraud prevention purposes, and as permitted by applicable laws, we may, but have no obligation to (i) ask Members to provide a form of government identification or other information or undertake additional checks designed to help verify the identities or backgrounds of Members, and (ii) screen Members against third-party databases or other sources and request reports from service providers.',
        },
        {
            title: '3. Booking Confirmation and Contractual Relationship',
            content: 'When you book an Accommodation, you are entering into a contract directly with the Host. StayCool Booking is not and does not become a party to or other participant in any contractual relationship between Members. StayCool Booking is not acting as an agent in any capacity for any Member, except as specified in the Payments Terms.',
        },
        {
            title: '4. Service Fees, Taxes, and Payment Terms',
            content: 'StayCool Booking may charge fees to Hosts and/or Guests ("Service Fees") in consideration for the use of the Platform. Any applicable Service Fees (including any applicable Taxes) will be displayed to a Guest prior to booking. StayCool Booking reserves the right to change the Service Fees at any time. You are responsible for paying any Service Fees that you owe to StayCool Booking.',
        },
        {
            title: '5. Damage to Accommodations and Security Deposits',
            content: 'As a Guest, you are responsible for leaving the Accommodation (including any personal or other property located at the Accommodation) in the condition it was in when you arrived. You are responsible for your own acts and omissions and are also responsible for the acts and omissions of any individuals whom you invite to, or otherwise provide access to, the Accommodation.',
        },
        {
            title: '6. Prohibited Conduct and Content Standards',
            content: 'You are solely responsible for compliance with any and all laws, rules, regulations, and Tax obligations that may apply to your use of the Platform. You agree not to: (i) use the Platform for any commercial or other purposes that are not expressly permitted by these Terms; (ii) copy, store or otherwise access or use any information, including personal identifying information about any other Member, in any way that is inconsistent with StayCool Booking’s Privacy Policy or these Terms; (iii) use the Platform in connection with the distribution of unsolicited commercial messages ("spam"); or (iv) offer, as a Host, any Accommodation that you do not yourself own or have permission to make available as a residential or other property through the Platform.',
        },
        {
            title: '7. Dispute Resolution, Arbitration, and Class Action Waiver',
            content: 'These Terms and your use of the Platform will be interpreted in accordance with the laws of the jurisdiction in which StayCool Booking is incorporated. You and StayCool Booking agree that any dispute, claim or controversy arising out of or relating to these Terms or the breach, termination, enforcement, interpretation or validity thereof, or to the use of the Platform (collectively, "Disputes") will be settled by binding arbitration.',
        },
        {
            title: '8. Indemnification and Limitation of Liability',
            content: 'To the maximum extent permitted by applicable law, you agree to release, defend, indemnify, and hold StayCool Booking and its affiliates and subsidiaries, and their officers, directors, employees and agents, harmless from and against any claims, liabilities, damages, losses, and expenses, including, without limitation, reasonable legal and accounting fees, arising out of or in any way connected with (i) your breach of these Terms or our Policies, (ii) your improper use of the Platform, (iii) your interaction with any Member, stay at an Accommodation, including without limitation any injuries, losses or damages (whether compensatory, direct, incidental, consequential or otherwise) of any kind arising in connection with or as a result of such interaction or stay.',
        },
        {
            title: '9. Termination and Account Suspension',
            content: 'StayCool Booking may terminate this Agreement and your account at any time by giving you thirty (30) days notice via email to your registered email address. StayCool Booking may also terminate this Agreement and your account immediately and without notice if (i) you have materially breached your obligations under these Terms, (ii) you have violated applicable laws, regulations or third party rights, or (iii) StayCool Booking believes in good faith that such action is reasonably necessary to protect the personal safety or property of StayCool Booking, its Members, or third parties.',
        },
    ];

    return (
        <div className="bg-[#080808] text-zinc-300 min-h-screen pt-32 pb-20 px-6 md:px-20">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-8">
                        StayCool <span className="text-sky-400">Terms of Service</span>
                    </h1>
                    <p className="font-sans text-zinc-500 mb-12 text-lg">
                        Last updated: March 1, 2026
                    </p>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-zinc-400 mb-12 leading-relaxed italic">
                            Please read these Terms of Service carefully as they contain important information about your legal rights, remedies and obligations. By accessing or using the StayCool Booking Platform, you agree to comply with and be bound by these Terms.
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
                                    <h2 className="font-heading text-2xl font-bold text-zinc-100 mb-6 group-hover:text-sky-400 transition-colors">
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
                            <h3 className="text-2xl font-bold font-heading text-white mb-4">Legal Questions?</h3>
                            <p className="font-sans text-zinc-500 mb-8 max-w-xl mx-auto">
                                If you have any questions about these Terms, please contact our legal department.
                            </p>
                            <a
                                href="mailto:legal@staycool.com"
                                className="inline-flex items-center justify-center px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sky-900/20"
                            >
                                Contact Legal Team
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsPage;
