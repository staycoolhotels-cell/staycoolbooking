'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { createNotification } from '@/lib/activity-actions';

interface LeaveReviewModalProps {
    booking: {
        id: string;
        property_id: string;
        guest_id: string;
        properties: {
            id?: string;
            title?: string;
            host_id?: string;
            images?: { url: string }[];
        };
    } | null;
    onClose: () => void;
    onSuccess?: () => void;
}

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({ booking, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Category Ratings
    const [cleanliness, setCleanliness] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [checkIn, setCheckIn] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [location, setLocation] = useState(0);
    const [value, setValue] = useState(0);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (!booking) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select an overall rating');
            return;
        }

        // Optional: Ensure all categories are rated if mandatory.
        // For now, I'll allow finishing even if some are missed, or I could default them.
        // But better to ask for them.
        if (cleanliness === 0 || accuracy === 0 || checkIn === 0 || communication === 0 || location === 0 || value === 0) {
            toast.error('Please rate all categories (Cleanliness, Accuracy, etc.)');
            return;
        }

        if (!comment.trim()) {
            toast.error('Please write a short review');
            return;
        }

        setSubmitting(true);

        const { error } = await supabase.from('reviews').insert({
            property_id: booking.property_id,
            booking_id: booking.id,
            reviewer_id: booking.guest_id,
            receiver_id: booking.properties?.host_id || null,
            rating,
            cleanliness_rating: cleanliness,
            accuracy_rating: accuracy,
            check_in_rating: checkIn,
            communication_rating: communication,
            location_rating: location,
            value_rating: value,
            comment: comment.trim(),
        });

        if (error) {
            // Check if already reviewed (unique constraint)
            if (error.code === '23505') {
                toast.error('You have already reviewed this stay.');
            } else {
                toast.error('An unexpected error occurred. Please try again later.');
            }
        } else {
            toast.success('Review submitted! Thank you 🌟');
            // Notify Host and Admin
            const hostId = booking.properties?.host_id;
            const propTitle = booking.properties?.title || 'Unknown Property';

            if (hostId) {
                await createNotification(
                    'new_review',
                    '⭐ New Guest Review!',
                    `A guest reviewed "${propTitle}" with ${rating} stars!`,
                    'info',
                    hostId,
                    'host',
                    '/host-dashboard'
                );
            }

            await createNotification(
                'new_review',
                '⭐ New Review Submitted',
                `A new ${rating}★ review was submitted for "${propTitle}".`,
                'info',
                null,
                'admin',
                '/admin-panel'
            );
            onSuccess?.();
            onClose();
        }
        setSubmitting(false);
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];
    const categories = [
        { label: 'Cleanliness', value: cleanliness, setter: setCleanliness },
        { label: 'Accuracy', value: accuracy, setter: setAccuracy },
        { label: 'Check-in', value: checkIn, setter: setCheckIn },
        { label: 'Communication', value: communication, setter: setCommunication },
        { label: 'Location', value: location, setter: setLocation },
        { label: 'Value for Money', value: value, setter: setValue },
    ];

    return (
        <AnimatePresence>
            {booking && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative"
                    >
                        {/* Close button - more prominent and top-right of whole card */}
                        <button
                            onClick={onClose}
                            className="absolute top-10 right-6 z-[210] p-2 rounded-full bg-black/60 text-white hover:bg-black/90 hover:scale-110 transition-all border border-white/10 shadow-lg"
                        >
                            <X size={20} />
                        </button>

                        {/* Property banner */}
                        <div className="relative h-28 overflow-hidden shrink-0">
                            <img
                                src={booking.properties.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6'}
                                alt={booking.properties.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                            
                            <div className="absolute bottom-3 left-4">
                                <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Rate Your Stay</p>
                                <h3 className="text-white font-bold truncate max-w-[350px]">{booking.properties.title}</h3>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                            {/* Overall Rating */}
                            <div className="text-center pb-4 border-b border-zinc-800/50">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Overall Satisfaction</label>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <motion.button
                                            key={star}
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="text-3xl transition-all duration-150"
                                        >
                                            <Star
                                                size={32}
                                                className={`transition-colors duration-100 ${star <= (hoverRating || rating)
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-zinc-700'
                                                    }`}
                                            />
                                        </motion.button>
                                    ))}
                                </div>
                                <AnimatePresence mode="wait">
                                    {(hoverRating || rating) > 0 && (
                                        <motion.p
                                            key={hoverRating || rating}
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-sm font-bold text-amber-400"
                                        >
                                            {ratingLabels[hoverRating || rating]}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Detailed Category Ratings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 py-4">
                                {categories.map((cat) => (
                                    <div key={cat.label} className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-300">{cat.label}</span>
                                            <span className="text-[10px] font-bold text-amber-500">{cat.value > 0 ? `${cat.value}.0` : '-'}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => cat.setter(star)}
                                                    className="focus:outline-none"
                                                >
                                                    <Star
                                                        size={18}
                                                        className={`transition-colors duration-150 ${star <= cat.value
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-zinc-800'
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Comment */}
                            <div className="pt-4 border-t border-zinc-800/50">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 block">
                                    Share your experience
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell others about your stay..."
                                    rows={3}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all resize-none"
                                />
                                <p className="text-[10px] text-zinc-600 mt-1 text-right">{comment.length}/500</p>
                            </div>
                        </div>

                        {/* Footer / Submit */}
                        <div className="p-6 bg-zinc-900/40 border-t border-zinc-800 shrink-0">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || rating === 0}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-900/30"
                            >
                                {submitting ? (
                                    <><Loader2 size={20} className="animate-spin" /> Submitting Reflection...</>
                                ) : (
                                    <><Send size={18} /> Publish Review</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LeaveReviewModal;
