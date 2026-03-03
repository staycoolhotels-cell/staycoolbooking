'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';

const HostResourcesPage = () => {
    const resourceCategories = [
        {
            title: 'Getting Started',
            description: 'Everything you need to know to set up your first listing and start welcoming guests.',
            resources: [
                { title: 'Host Onboarding Guide', icon: 'BookOpenIcon', link: '#' },
                { title: 'Photography Tips', icon: 'CameraIcon', link: '#' },
                { title: 'Writing Compelling Descriptions', icon: 'PencilIcon', link: '#' }
            ]
        },
        {
            title: 'Optimizing Your Listing',
            description: 'Advanced strategies to increase your visibility and booking rate.',
            resources: [
                { title: 'Dynamic Pricing Strategies', icon: 'TrendingUpIcon', link: '#' },
                { title: 'SEO for Your Property', icon: 'SearchIcon', link: '#' },
                { title: 'Managing Guest Reviews', icon: 'StarIcon', link: '#' }
            ]
        },
        {
            title: 'Hospitality Excellence',
            description: 'Provide an unforgettable experience that keeps guests coming back.',
            resources: [
                { title: 'The Perfect Check-in Flow', icon: 'KeyIcon', link: '#' },
                { title: 'Cleaning & Maintenance Standards', icon: 'SparklesIcon', link: '#' },
                { title: 'Local Recommendations Guide', icon: 'MapIcon', link: '#' }
            ]
        },
        {
            title: 'Host Tools & Safety',
            description: 'Leverage our platform tools to protect your property and manage your business.',
            resources: [
                { title: 'Using the Host Dashboard', icon: 'LayoutIcon', link: '#' },
                { title: 'Insurance & Claims Process', icon: 'ShieldCheckIcon', link: '#' },
                { title: 'Secure Messaging Best Practices', icon: 'MessageSquareIcon', link: '#' }
            ]
        }
    ];

    const stats = [
        { label: 'Active Hosts', value: '50,000+' },
        { label: 'Avg. Monthly Earnings', value: '$2,400' },
        { label: 'Host Satisfaction', value: '4.9/5' },
        { label: 'Global Destinations', value: '120+' }
    ];

    return (
        <div className="bg-[#080808] text-zinc-300 min-h-screen pt-32 pb-20 px-6 md:px-20">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20">
                                    <Icon name="BriefcaseIcon" className="text-sky-400" size={28} />
                                </div>
                                <h1 className="font-heading text-4xl md:text-6xl font-bold text-white italic">
                                    Host <span className="text-sky-400">Success Hub</span>
                                </h1>
                            </div>
                            <p className="font-sans text-xl text-zinc-400 mb-8 leading-relaxed">
                                Empowering hosts with the tools, knowledge, and support needed to build a thriving hospitality business on StayCool.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center p-4">
                                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                                    <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {resourceCategories.map((category, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-zinc-900/20 border border-zinc-800/50 p-8 rounded-3xl hover:border-sky-500/30 transition-all group"
                            >
                                <h2 className="font-heading text-2xl font-bold text-white mb-3 group-hover:text-sky-400 transition-colors">
                                    {category.title}
                                </h2>
                                <p className="font-sans text-zinc-500 mb-8 max-w-md">
                                    {category.description}
                                </p>
                                <div className="space-y-3">
                                    {category.resources.map((resource, i) => (
                                        <a
                                            key={i}
                                            href={resource.link}
                                            className="flex items-center justify-between p-4 bg-zinc-800/20 rounded-xl hover:bg-zinc-800/40 border border-zinc-700/20 hover:border-zinc-700/50 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon name={resource.icon} size={18} className="text-sky-400" />
                                                <span className="text-zinc-300 font-medium">{resource.title}</span>
                                            </div>
                                            <Icon name="ArrowRightIcon" size={16} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-24 p-12 bg-gradient-to-br from-zinc-900 to-[#080808] rounded-[3rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 blur-[150px] rounded-full -mr-48 -mt-48"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="max-w-xl text-center md:text-left">
                                <h3 className="text-3xl font-bold font-heading text-white mb-4">Want specialized 1-on-1 coaching?</h3>
                                <p className="font-sans text-zinc-500 text-lg">
                                    Our "Super Host Ambassador" program pairs experienced hosts with newcomers to accelerate your success.
                                </p>
                            </div>
                            <button className="whitespace-nowrap px-10 py-5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-sky-900/40">
                                Apply for Coaching
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HostResourcesPage;
