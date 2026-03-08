'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Rocket,
    Heart,
    Users,
    Zap,
    Globe,
    Shield,
    Code,
    Palette,
    BarChart
} from 'lucide-react';

const CareersPage = () => {
    const values = [
        {
            icon: <Rocket className="text-sky-400" />,
            title: 'Innovation',
            description: 'We push boundaries and redefine what\'s possible in the travel industry.',
        },
        {
            icon: <Heart className="text-sky-400" />,
            title: 'Integrity',
            description: 'We build trust through transparency and ethical practices in everything we do.',
        },
        {
            icon: <Users className="text-sky-400" />,
            title: 'Inclusivity',
            description: 'We believe diverse perspectives drive the best ideas and experiences.',
        },
        {
            icon: <Zap className="text-sky-400" />,
            title: 'Impact',
            description: 'We focus on creating meaningful value for our guests and hosts.',
        },
    ];

    const benefits = [
        'Remote-first culture with flexible hours',
        'Comprehensive health, dental, and vision insurance',
        'Generous travel stipends to experience our stays',
        'Annual learning and development budget',
        'Modern tech stack and high-end equipment',
        'Inclusive parental leave and family support',
    ];

    const roles = [
        {
            dept: 'Marketplace Operations',
            jobs: [
                { title: 'Host Success Lead', type: 'Full-time / Remote' },
                { title: 'Quality Verification Specialist (100-Point Audit)', type: 'Full-time / Remote' },
                { title: 'Marketplace Integrity Manager', type: 'Full-time / Remote' },
            ],
        },
        {
            dept: 'Guest Experience',
            jobs: [
                { title: 'Luxury Travel Concierge', type: 'Full-time / Remote' },
                { title: 'Experience Curation Specialist', type: 'Full-time / Remote' },
            ],
        },
        {
            dept: 'Product Engineering',
            jobs: [
                { title: 'Booking Engine Specialist', type: 'Full-time / Remote' },
                { title: 'Search & Discovery Engineer', type: 'Full-time / Remote' },
                { title: 'Trust & Safety Engineer', type: 'Full-time / Remote' },
            ],
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="bg-[#080808] text-zinc-300 min-h-screen pt-32 pb-20 overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-20">
                {/* --- Hero Section --- */}
                <div className="text-center mb-24">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="font-heading text-5xl md:text-8xl font-black text-white mb-8 tracking-tight"
                    >
                        Shape the Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
                            Modern Travel.
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="font-sans text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed"
                    >
                        We're on a mission to curate the world's most exceptional stays.
                        Join us in building the technology that makes discovery effortless and hosting magical.
                    </motion.p>
                </div>

                {/* --- Values Section --- */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-40"
                >
                    {values.map((v, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            className="p-8 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 hover:bg-zinc-800/40 transition-all group shadow-xl backdrop-blur-sm"
                        >
                            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center mb-6 border border-sky-500/20 group-hover:scale-110 transition-transform">
                                {v.icon}
                            </div>
                            <h3 className="font-heading text-xl font-bold text-white mb-3">{v.title}</h3>
                            <p className="font-sans text-zinc-500 text-sm leading-relaxed">{v.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* --- Why Us / Benefits --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-heading text-4xl font-bold text-white mb-8">Why StayCool?</h2>
                        <p className="font-sans text-zinc-400 mb-8 leading-relaxed">
                            We empower our team people to do their best work. From flexible schedules to
                            travel stipends, we invest in your growth and well-being.
                        </p>
                        <ul className="space-y-4">
                            {benefits.map((b, i) => (
                                <li key={i} className="flex items-start gap-3 text-zinc-300">
                                    <Globe size={18} className="text-sky-500 mt-1 flex-shrink-0" />
                                    <span className="font-sans">{b}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative aspect-square md:aspect-video lg:aspect-square bg-gradient-to-br from-sky-500/20 to-blue-600/20 rounded-[3rem] overflow-hidden border border-zinc-800 shadow-2xl"
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse backdrop-blur-md">
                                <Rocket className="text-white w-10 h-10" />
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-2">Build something iconic.</h4>
                            <p className="text-zinc-400">Join a team that values craft over speed.</p>
                        </div>
                        {/* Decorative blurs */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/20 blur-[100px] rounded-full"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
                    </motion.div>
                </div>

                {/* --- Open Roles --- */}
                <div className="mb-40">
                    <h2 className="font-heading text-4xl font-bold text-white mb-12 text-center">Open Positions</h2>
                    <div className="space-y-12 max-w-4xl mx-auto">
                        {roles.map((dept, i) => (
                            <div key={i}>
                                <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-sky-400 mb-6 flex items-center gap-3">
                                    <span className="h-px bg-sky-400/30 flex-grow"></span>
                                    {dept.dept}
                                    <span className="h-px bg-sky-400/30 flex-grow"></span>
                                </h3>
                                <div className="space-y-4">
                                    {dept.jobs.map((job, j) => (
                                        <motion.div
                                            key={j}
                                            whileHover={{ x: 10 }}
                                            className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/80 hover:border-sky-500/50 hover:bg-zinc-900/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                                        >
                                            <div>
                                                <h4 className="font-heading text-lg font-bold text-zinc-100">{job.title}</h4>
                                                <p className="font-sans text-xs text-zinc-500">{job.type}</p>
                                            </div>
                                            <button className="px-6 py-2 bg-zinc-800 hover:bg-sky-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 group">
                                                Apply Now
                                                <Zap size={14} className="group-hover:fill-current" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Final CTA --- */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="p-16 bg-gradient-to-r from-zinc-900 via-[#0a0a0a] to-zinc-900 rounded-[3rem] border border-zinc-800 text-center relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
                    <h2 className="font-heading text-4xl font-bold text-white mb-6 relative z-10">Don't see a fit?</h2>
                    <p className="font-sans text-zinc-500 mb-10 max-w-xl mx-auto relative z-10 leading-relaxed">
                        We're always looking for exceptional talent. If you're passionate about travel and technology,
                        send us your resume and tell us how you'd make StayCool better.
                    </p>
                    <a
                        href="mailto:support@staycoolbooking.com"
                        className="inline-flex items-center px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-sky-900/20 relative z-10"
                    >
                        General Application
                    </a>

                    {/* Decorative background circles */}
                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-sky-500/5 blur-3xl rounded-full"></div>
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600/5 blur-3xl rounded-full"></div>
                </motion.div>
            </div>
        </div>
    );
};

export default CareersPage;
