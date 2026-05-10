'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Post {
    id: string;
    title: string;
    content: string;
    category: string;
    author_id: string;
    likes_count: number;
    replies_count: number;
    is_trending: boolean;
    created_at: string;
    author?: {
        name: string;
        avatar_url: string;
    };
    isLiked?: boolean;
}

const CommunityForumPage = () => {
    const [activeTab, setActiveTab] = useState('Discussions');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Host Tips' });

    const categories = ['All', 'Host Tips', 'Guest Stories', 'Product Updates', 'Local Gems', 'Safety & Trust'];

    useEffect(() => {
        // Initial fetch
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            fetchPosts(user?.id);
        };
        init();

        // Auth listener
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
            const user = session?.user || null;
            setCurrentUser(user);
            fetchPosts(user?.id);
        });

        // Real-time subscription for posts and likes
        const channel = supabase
            .channel('community_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'community_posts' },
                async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    fetchPosts(user?.id);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'community_likes' },
                async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    fetchPosts(user?.id);
                }
            )
            .subscribe();

        return () => {
            authListener.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchPosts = async (userId?: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    author:users!author_id (
                        name,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error fetching posts:', error);
                throw new Error(error.message || 'Failed to fetch posts');
            }

            if (!data) {
                setPosts([]);
                return;
            }

            let enrichedPosts = data as Post[];

            if (userId) {
                const { data: likes, error: likesError } = await supabase
                    .from('community_likes')
                    .select('post_id')
                    .eq('user_id', userId);
                
                if (likesError) {
                    console.error('Error fetching likes:', likesError);
                } else {
                    const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
                    enrichedPosts = enrichedPosts.map(post => {
                        if (!post) return post;
                        return {
                            ...post,
                            isLiked: likedPostIds.has(post.id)
                        };
                    });
                }
            }

            setPosts(enrichedPosts);
        } catch (error: any) {
            console.error('Detailed error in fetchPosts:', error);
            toast.error(error.message || 'Failed to load discussions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            toast.error('Please login to start a discussion');
            return;
        }

        if (!newPost.title || !newPost.content) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('community_posts')
                .insert({
                    title: newPost.title,
                    content: newPost.content,
                    category: newPost.category,
                    author_id: currentUser.id
                });

            if (error) throw error;

            toast.success('Discussion started successfully!');
            setShowCreateModal(false);
            setNewPost({ title: '', content: '', category: 'Host Tips' });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (postId: string, isLiked: boolean) => {
        if (!currentUser) {
            toast.error('Please login to like posts');
            return;
        }

        try {
            if (isLiked) {
                await supabase
                    .from('community_likes')
                    .delete()
                    .match({ post_id: postId, user_id: currentUser.id });
            } else {
                await supabase
                    .from('community_likes')
                    .insert({ post_id: postId, user_id: currentUser.id });
            }
            // Update local state for immediate feedback
            setPosts(posts.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        isLiked: !isLiked,
                        likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1
                    };
                }
                return p;
            }));
        } catch (error: any) {
            toast.error('Action failed');
        }
    };

    const filteredDiscussions = posts.filter(d => {
        const categoryMatch = selectedCategory === 'All' || d.category === selectedCategory;
        const tabMatch = activeTab === 'Discussions' || 
                        (activeTab === 'Trending' && d.is_trending) || 
                        (activeTab === 'My Posts' && d.author_id === currentUser?.id);
        return categoryMatch && tabMatch;
    });

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
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-sky-900/40"
                        >
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

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                                    <p className="text-zinc-500 font-sans">Loading discussions...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <AnimatePresence mode="popLayout">
                                        {filteredDiscussions.length > 0 ? (
                                            filteredDiscussions.map((post, i) => (
                                                <motion.div
                                                    key={post.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-3xl hover:border-zinc-700/50 transition-all group"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="relative">
                                                            <img 
                                                                src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'User'}`} 
                                                                alt={post.author?.name} 
                                                                className="w-10 h-10 rounded-full border border-zinc-800 object-cover bg-zinc-800" 
                                                            />
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#080808] rounded-full"></div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-[10px] uppercase font-bold tracking-tighter text-sky-500 bg-sky-500/5 px-2 py-0.5 rounded-md border border-sky-500/10">
                                                                    {post.category}
                                                                </span>
                                                                <span className="text-zinc-600 text-xs">•</span>
                                                                <span className="text-zinc-500 text-xs">{post.author?.name || 'Anonymous'}</span>
                                                                <span className="text-zinc-600 text-xs">•</span>
                                                                <span className="text-zinc-700 text-xs italic">
                                                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                            <h2 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-sky-400 transition-colors">
                                                                {post.title}
                                                            </h2>
                                                            <p className="text-zinc-500 text-sm mb-4 line-clamp-2">
                                                                {post.content}
                                                            </p>
                                                            <div className="flex items-center gap-x-6 gap-y-3 flex-wrap mt-auto">
                                                                <div className="flex items-center gap-1.5 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                                                    <Icon name="MessageSquareIcon" size={14} />
                                                                    <span className="text-xs font-medium">{post.replies_count} replies</span>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleLike(post.id, !!post.isLiked)}
                                                                    className={`flex items-center gap-1.5 transition-all active:scale-90 ${post.isLiked ? 'text-rose-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                                >
                                                                    <Icon name="HeartIcon" size={14} variant={post.isLiked ? 'solid' : 'outline'} />
                                                                    <span className="text-xs font-medium">{post.likes_count} likes</span>
                                                                </button>
                                                                {post.is_trending && (
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
                                            ))
                                        ) : (
                                            <div className="text-center py-20 bg-zinc-900/10 rounded-3xl border border-dashed border-zinc-800">
                                                <p className="text-zinc-600">No discussions found in this category.</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            <button className="w-full mt-12 py-4 border border-dashed border-zinc-800 text-zinc-600 font-sans text-sm hover:border-sky-500/30 hover:text-sky-500 transition-all rounded-3xl">
                                Load more discussions
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Create Post Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white font-heading">Start a <span className="text-sky-400">Discussion</span></h2>
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <Icon name="XMarkIcon" size={24} className="text-zinc-500" />
                                </button>
                            </div>

                            <form onSubmit={handleCreatePost} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Category</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {categories.filter(c => c !== 'All').map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setNewPost({ ...newPost, category: cat })}
                                                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                                                    newPost.category === cat 
                                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 shadow-lg shadow-sky-900/20' 
                                                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Title</label>
                                    <input 
                                        type="text"
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        placeholder="What's on your mind?"
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 transition-all font-sans"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Content</label>
                                    <textarea 
                                        value={newPost.content}
                                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                        placeholder="Share your thoughts, tips, or questions with the community..."
                                        rows={6}
                                        className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 transition-all font-sans resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-sky-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Icon name="PaperAirplaneIcon" size={18} />
                                            <span>Post Discussion</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommunityForumPage;

