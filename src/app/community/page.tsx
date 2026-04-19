'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

const CommunityForumPage = () => {
    const [activeTab, setActiveTab] = useState('Discussions');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'Host Tips', 'Guest Stories', 'Product Updates', 'Local Gems', 'Safety & Trust'];

    const discussions = [
        {
            id: 1,
            title: 'Tips for first-time hosts in urban areas?',
            author: 'Sarah M.',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            category: 'Host Tips',
            replies: 24,
            likes: 42,
            time: '2h ago',
            trending: true
        },
        {
            id: 2,
            title: 'Our magical stay in the Swiss Alps - A Photo Journal',
            author: 'James L.',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
            category: 'Guest Stories',
            replies: 156,
            likes: 892,
            time: '5h ago',
            trending: true
        },
        {
            id: 3,
            title: 'New: Enhanced payout tracking now live!',
            author: 'StayCool Team',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StayCool',
            category: 'Product Updates',
            replies: 12,
            likes: 56,
            time: '1d ago',
            trending: false
        },
        {
            id: 4,
            title: 'How to handle late check-out requests professionally?',
            author: 'Elena G.',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
            category: 'Host Tips',
            replies: 89,
            likes: 124,
            time: '3h ago',
            trending: false
        }
    ];

    const filteredDiscussions = discussions.filter(d =>
        selectedCategory === 'All' || d.category === selectedCategory
    );

    return (
        <div className="bg-[#080808] text-zinc-300 min-h-screen pt-20 pb-20 px-6 md:px-20">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link 
                            href="/admin-panel" 
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all group active:scale-95"
                        >
                            <Icon name="ArrowLeftIcon" size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Back to Dashboard</span>
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="max-w-2xl">
                            <h1 className="font-heading text-4xl md:text-7xl font-bold text-white mb-6">
                                StayCool <span className="text-sky-400">Community</span>
                            </h1>
                            <p className="font-sans text-xl text-zinc-500 leading-relaxed">
                                Share stories, ask questions, and connect with a global network of travelers and hosts.
                            </p>
                        </div>
                        <button className="px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-sky-900/40">
                            Start a Discussion
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Sidebar */}
                        <div className="lg:col-span-3 space-y-8">
                            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl backdrop-blur-sm">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Categories</h3>
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-sans text-sm ${selectedCategory === cat
                                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-lg shadow-sky-900/20'
                                                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-sky-600/10 to-transparent border border-sky-500/10 p-6 rounded-3xl">
                                <h3 className="text-sm font-bold text-sky-400 mb-4">Community Rules</h3>
                                <ul className="space-y-3 text-xs text-zinc-500 leading-relaxed">
                                    <li>• Be respectful and kind to others.</li>
                                    <li>• No spam or self-promotion.</li>
                                    <li>• Keep discussions travel-related.</li>
                                    <li>• Protect your personal privacy.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Main Feed */}
                        <div className="lg:col-span-9">
                            <div className="flex items-center gap-8 border-b border-zinc-900 mb-8">
                                {['Discussions', 'Trending', 'My Posts'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 px-2 font-sans text-sm font-bold transition-all relative ${activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
                                            }`}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6">
                                {filteredDiscussions.map((post, i) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-3xl hover:border-zinc-700/50 transition-all group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full border border-zinc-800" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] uppercase font-bold tracking-tighter text-sky-500 bg-sky-500/5 px-2 py-0.5 rounded-md border border-sky-500/10">
                                                        {post.category}
                                                    </span>
                                                    <span className="text-zinc-600 text-xs">•</span>
                                                    <span className="text-zinc-500 text-xs">{post.author}</span>
                                                    <span className="text-zinc-600 text-xs">•</span>
                                                    <span className="text-zinc-700 text-xs italic">{post.time}</span>
                                                </div>
                                                <h2 className="text-xl font-bold text-zinc-100 mb-4 group-hover:text-sky-400 transition-colors">
                                                    {post.title}
                                                </h2>
                                                <div className="flex items-center gap-x-4 gap-y-3 flex-wrap mt-auto">
                                                    <div className="flex items-center gap-1.5 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                                        <Icon name="MessageSquareIcon" size={14} />
                                                        <span className="text-xs font-medium">{post.replies} replies</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                                        <Icon name="HeartIcon" size={14} />
                                                        <span className="text-xs font-medium">{post.likes} likes</span>
                                                    </div>
                                                    {post.trending && (
                                                        <div className="flex items-center gap-1.5 text-orange-500/80 bg-orange-500/5 px-2 py-0.5 rounded-md border border-orange-500/10">
                                                            <Icon name="TrendingUpIcon" size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-tight">Trending</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button className="p-3 bg-zinc-800/0 hover:bg-zinc-800/50 rounded-xl transition-all">
                                                <Icon name="ChevronRightIcon" size={20} className="text-zinc-700 group-hover:text-zinc-400" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <button className="w-full mt-12 py-4 border border-dashed border-zinc-800 text-zinc-600 font-sans text-sm hover:border-sky-500/30 hover:text-sky-500 transition-all rounded-3xl">
                                Load more discussions
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CommunityForumPage;
