'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

const HelpCenterPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const categories = ['All', 'Booking', 'Hosting', 'Payments', 'Safety'];

    const faqs = [
        {
            id: 1,
            category: 'Booking',
            question: 'How do I cancel my reservation?',
            answer: 'You can cancel your reservation through your user profile under "My Bookings". Please refer to our Cancellation Policy page for details on refund eligibility based on how far in advance you cancel.'
        },
        {
            id: 2,
            category: 'Safety',
            question: 'What should I do in case of an emergency?',
            answer: 'If you are in immediate danger, contact local emergency services first. Once you are safe, please contact our 24/7 Safety Line at +1-800-STAYCOOL or use the "Report an Issue" button in the Safety & Trust Center.'
        },
        {
            id: 3,
            category: 'Payments',
            question: 'When will I be charged for my booking?',
            answer: 'Your payment is processed as soon as the host confirms your booking. However, we hold the funds in escrow and only release them to the host 24 hours after your successful check-in.'
        },
        {
            id: 4,
            category: 'Hosting',
            question: 'How do I become a host?',
            answer: 'Click on the "Become a Host" button in the navigation bar. You will need to provide property details, high-quality photos, and complete our identity verification process.'
        },
        {
            id: 5,
            category: 'Booking',
            question: 'Can I change my check-in dates?',
            answer: 'Date changes depend on the host\'s availability and the property\'s specific house rules. You can request a change through the messaging system with your host.'
        },
        {
            id: 6,
            category: 'Payments',
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards (Visa, Mastercard, American Express), Digital Wallets (Apple Pay, Google Pay), and in some regions, direct bank transfers.'
        }
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="bg-[#080808] text-zinc-300 min-h-screen pt-32 pb-20 px-6 md:px-20">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-16">
                        <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6">
                            How can we <span className="text-sky-400">help you?</span>
                        </h1>
                        <div className="relative max-w-2xl mx-auto mt-8">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Icon name="SearchIcon" className="text-zinc-500" size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search for questions, keywords..."
                                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-sans"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-6 py-2 rounded-full font-sans text-sm font-semibold transition-all ${activeCategory === category
                                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode='popLayout'>
                            {filteredFaqs.map((faq) => (
                                <motion.div
                                    key={faq.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                        className="w-full p-6 flex items-center justify-between text-left hover:bg-zinc-800/20 transition-colors"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">{faq.category}</span>
                                            <span className="text-lg font-semibold text-zinc-100">{faq.question}</span>
                                        </div>
                                        <Icon
                                            name="ChevronDownIcon"
                                            className={`text-zinc-500 transition-transform duration-300 ${expandedFaq === faq.id ? 'rotate-180' : ''}`}
                                            size={20}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {expandedFaq === faq.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="px-6 pb-6"
                                            >
                                                <div className="pt-2 border-t border-zinc-800/50 text-zinc-400 leading-relaxed font-sans">
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredFaqs.length === 0 && (
                            <div className="text-center py-20 bg-zinc-900/10 rounded-3xl border border-dashed border-zinc-800">
                                <p className="text-zinc-500 font-sans">No questions found matching your search.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-zinc-900/50 rounded-3xl border border-zinc-800 relative overflow-hidden group hover:border-sky-500/30 transition-colors">
                            <div className="relative z-10">
                                <Icon name="MessagesSquareIcon" className="text-sky-400 mb-4" size={32} />
                                <h3 className="text-xl font-bold text-white mb-2">Chat with us</h3>
                                <p className="text-zinc-500 text-sm mb-6">Our average response time is less than 5 minutes.</p>
                                <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all">
                                    Start Chat
                                </button>
                            </div>
                        </div>
                        <div className="p-8 bg-zinc-900/50 rounded-3xl border border-zinc-800 relative overflow-hidden group hover:border-sky-500/30 transition-colors">
                            <div className="relative z-10">
                                <Icon name="MailIcon" className="text-sky-400 mb-4" size={32} />
                                <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
                                <p className="text-zinc-500 text-sm mb-6">Send us a detailed message and we\'ll get back within 24 hours.</p>
                                <a href="mailto:support@staycoolbooking.com" className="block w-full text-center py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-900/20">
                                    Email Us
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HelpCenterPage;
