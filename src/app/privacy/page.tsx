'use client';

import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPage = () => {
    const sections = [
        {
            title: '1. Data Collection',
            content: 'We collect several types of information from and about users of our Platform, including: (i) Personal Information by which you may be personally identified, such as name, postal address, e-mail address, telephone number, and payment information; (ii) Usage Data about your internet connection, the equipment you use to access our Platform, and usage details; and (iii) Cookies and Tracking technologies that collect information about your browsing activities over time and across different websites.',
        },
        {
            title: '2. Legal Basis for Processing',
            content: 'We process your personal information under several legal bases: (i) Performance of a Contract – to provide the services you requested; (ii) Legitimate Interests – for fraud prevention, maintaining security, and improving our Platform; (iii) Consent – where you have given us clear consent to process your data for a specific purpose; and (iv) Legal Obligation – to comply with our statutory and public interest obligations.',
        },
        {
            title: '3. Third-Party Data Sharing',
            content: 'We may disclose aggregated information about our users without restriction. We may disclose personal information that we collect or you provide as described in this privacy policy: (i) To our subsidiaries and affiliates; (ii) To contractors, service providers, and other third parties we use to support our business (such as payment processors and verification services); (iii) To a buyer or other successor in the event of a merger or divestiture; and (iv) To Hosts or Guests as necessary to facilitate bookings and interactions on the Platform.',
        },
        {
            title: '4. Data Retention and Deletion',
            content: 'We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your personal information to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.',
        },
        {
            title: '5. International Data Transfers',
            content: 'Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.',
        },
        {
            title: '6. Your Rights',
            content: 'Depending on your location, you may have the following rights regarding your personal information: (i) The right to access, update or delete the information we have on you; (ii) The right of rectification; (iii) The right to object; (iv) The right of restriction; (v) The right to data portability; and (vi) The right to withdraw consent. To exercise these rights, please contact us using the details below.',
        },
        {
            title: '7. Children\'s Privacy',
            content: 'Our Platform is not intended for children under 18 years of age. No one under age 18 may provide any personal information to or on the Platform. We do not knowingly collect personal information from children under 18. If you are under 18, do not use or provide any information on this Platform or on or through any of its features.',
        },
        {
            title: '8. California Privacy Rights (CCPA)',
            content: 'If you are a California resident, California law may provide you with additional rights regarding our use of your personal information. To learn more about your California privacy rights, including the right to opt-out of the "sale" of your personal information (as defined by CCPA), please visit our dedicated CCPA notice page or contact our privacy officer.',
        },
        {
            title: '9. Security Measures',
            content: 'We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. The safety and security of your information also depends on you. Where we have given you (or where you have chosen) a password for access to certain parts of our Platform, you are responsible for keeping this password confidential.',
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
                        StayCool <span className="text-sky-400">Privacy Policy</span>
                    </h1>
                    <p className="font-sans text-zinc-500 mb-12 text-lg">
                        Last updated: March 1, 2026
                    </p>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-zinc-400 mb-12 leading-relaxed italic">
                            Your privacy is of paramount importance to us. This Privacy Policy outlines how StayCool Booking collects, uses, maintains, and protects your personal information when you use our Platform.
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
                                    <div className="font-sans leading-relaxed text-zinc-400 bg-zinc-900/40 p-8 rounded-2xl border border-zinc-800/50 hover:border-zinc-700/50 transition-all shadow-xl backdrop-blur-sm">
                                        {section.content}
                                    </div>
                                </motion.section>
                            ))}
                        </div>
                    </div>

                    <div className="mt-24 p-12 bg-gradient-to-br from-zinc-900 to-[#080808] rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>
                        <div className="relative z-10 text-center">
                            <h3 className="text-2xl font-bold font-heading text-white mb-4">Privacy Concerns?</h3>
                            <p className="font-sans text-zinc-500 mb-8 max-w-xl mx-auto">
                                If you have any questions or concerns regarding our privacy practices, please reach out to our Data Protection Officer.
                            </p>
                            <a
                                href="mailto:staycoolhotels@gmail.com"
                                className="inline-flex items-center justify-center px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sky-900/20"
                            >
                                Contact Privacy Officer
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPage;
