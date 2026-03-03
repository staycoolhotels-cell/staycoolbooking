'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

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

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    if (!booking) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select at least 1 star');
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
            comment: comment.trim(),
        });

        if (error) {
            // Check if already reviewed (unique constraint)
            if (error.code === '23505') {
                toast.error('You have already reviewed this stay.');
            } else {
                toast.error(`Failed to submit review: ${error.message}`);
            }
        } else {
            toast.success('Review submitted! Thank you 🌟');
            onSuccess?.();
            onClose();
        }
        setSubmitting(false);
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];
    const displayRating = hoverRating || rating;

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
                        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Property banner */}
                        <div className="relative h-32 overflow-hidden">
                            <img
                                src={booking.properties.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6'}
                                alt={booking.properties.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <div className="absolute bottom-3 left-4">
                                <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Rate Your Stay</p>
                                <h3 className="text-white font-bold truncate max-w-[280px]">{booking.properties.title}</h3>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Star Rating */}
                            <div className="text-center">
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
                                                size={36}
                                                className={`transition-colors duration-100 ${star <= displayRating
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-zinc-700'
                                                    }`}
                                            />
                                        </motion.button>
                                    ))}
                                </div>
                                <AnimatePresence mode="wait">
                                    {displayRating > 0 && (
                                        <motion.p
                                            key={displayRating}
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-sm font-bold text-amber-400"
                                        >
                                            {ratingLabels[displayRating]}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                                    Share your experience
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell others about your stay — the highlights, the ambiance, what made it special..."
                                    rows={4}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all resize-none"
                                />
                                <p className="text-[10px] text-zinc-600 mt-1 text-right">{comment.length}/500</p>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || rating === 0}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-900/30"
                            >
                                {submitting ? (
                                    <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                                ) : (
                                    <><Send size={16} /> Submit Review</>
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
