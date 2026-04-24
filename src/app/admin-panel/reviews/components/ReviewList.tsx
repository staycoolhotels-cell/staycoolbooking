'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Review } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, BadgeCheck, AlertTriangle, Trash2, Eye, Calendar, User, Shield, Info } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  icon: any;
  glow: string;
  border: string;
  iconColor: string;
  blobColor: string;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
}

const KpiCard = ({ title, value, icon: IconComponent, glow, border, iconColor, blobColor, subtitle, onClick, active }: KpiCardProps) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`relative group overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl p-5 md:p-6 transition-all duration-500 cursor-pointer border ${
      active ? 'ring-2 ring-white/20' : ''
    }`}
    style={{ borderColor: active ? glow : border, boxShadow: active ? `0 0 20px ${glow}` : 'none' }}
  >
    {/* Glow on hover or if active */}
    <div
      className={`absolute inset-0 transition-opacity duration-700 rounded-2xl ${active ? 'opacity-40' : 'opacity-0 group-hover:opacity-100'}`}
      style={{ boxShadow: `inset 0 0 40px ${glow}` }}
    />
    {/* Blob */}
    <div
      className={`absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl transition-opacity duration-500 ${active ? 'opacity-40' : 'opacity-20 group-hover:opacity-40'}`}
      style={{ backgroundColor: blobColor }}
    />
    {/* Bottom accent */}
    <div
      className={`absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      style={{ background: `linear-gradient(to right, transparent, ${glow}, transparent)` }}
    />

    <div className="relative z-10 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-xl border backdrop-blur-sm group-hover:scale-110 transition-transform duration-300"
          style={{ borderColor: border, backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <IconComponent size={20} className={iconColor} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1.5">{title}</p>
        <h3 className="text-2xl md:text-3xl font-heading font-black text-white tracking-tight leading-none">
          {value}
        </h3>
        {subtitle && <p className="text-[10px] text-zinc-600 mt-2 font-medium">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

interface ReviewListProps {
  initialReviews: Review[];
}

const ReviewList = ({ initialReviews }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReviews((prev) => [...prev, payload.new as Review]);
        } else if (payload.eventType === 'UPDATE') {
          setReviews((prev) =>
            prev.map((r) => (r.id === payload.new.id ? (payload.new as Review) : r))
          );
        } else if (payload.eventType === 'DELETE') {
          setReviews((prev) => prev.filter((r) => r.id !== (payload.old as Review).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    
    setIsDeleting(true);
    const { error } = await supabase.from('reviews').delete().eq('id', selectedReview.id);
    setIsDeleting(false);
    
    if (error) {
      toast.error('Failed to delete review');
      return;
    }
    
    toast.success('Review deleted successfully');
    setIsDeleteDialogOpen(false);
    setSelectedReview(null);
  };

  const handleOpenDetails = (review: Review) => {
    setSelectedReview(review);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  const [activeFilter, setActiveFilter] = useState<'all' | '5-star' | 'critical'>('all');

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;
    const fiveStars = reviews.filter((r) => r.rating === 5).length;
    const critical = reviews.filter((r) => r.rating <= 2).length;
    return { total, avg: avg.toFixed(1), fiveStars, critical };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    switch (activeFilter) {
      case '5-star':
        return reviews.filter((r) => r.rating === 5);
      case 'critical':
        return reviews.filter((r) => r.rating <= 2);
      default:
        return reviews;
    }
  }, [reviews, activeFilter]);

  const kpiCards: KpiCardProps[] = [
    {
      title: 'Total Reviews',
      value: String(stats.total),
      icon: MessageSquare,
      glow: 'rgba(99,102,241,0.35)',
      border: 'rgba(99,102,241,0.25)',
      iconColor: 'text-indigo-400',
      blobColor: 'rgba(99,102,241,0.5)',
      subtitle: 'Verified guest feedback',
      active: activeFilter === 'all',
      onClick: () => setActiveFilter('all'),
    },
    {
      title: 'Average Rating',
      value: String(stats.avg),
      icon: Star,
      glow: 'rgba(234,179,8,0.35)',
      border: 'rgba(234,179,8,0.25)',
      iconColor: 'text-amber-400',
      blobColor: 'rgba(234,179,8,0.5)',
      subtitle: 'Platform quality score',
      active: false, // Just informational
      onClick: () => {
        setActiveFilter('all');
        toast.info(`Current platform average is ${stats.avg} based on ${stats.total} reviews.`);
      },
    },
    {
      title: '5 Star Excellence',
      value: String(stats.fiveStars),
      icon: BadgeCheck,
      glow: 'rgba(16,185,129,0.35)',
      border: 'rgba(16,185,129,0.25)',
      iconColor: 'text-emerald-400',
      blobColor: 'rgba(16,185,129,0.5)',
      subtitle: 'Maximum guest satisfaction',
      active: activeFilter === '5-star',
      onClick: () => setActiveFilter('5-star'),
    },
    {
      title: 'Critical Alerts',
      value: String(stats.critical),
      icon: AlertTriangle,
      glow: 'rgba(239,68,68,0.35)',
      border: 'rgba(239,68,68,0.25)',
      iconColor: 'text-rose-400',
      blobColor: 'rgba(239,68,68,0.5)',
      subtitle: 'Requires attention (1-2★)',
      active: activeFilter === 'critical',
      onClick: () => setActiveFilter('critical'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
          >
            <KpiCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* ── Reviews Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/8"
      >
        <div className="p-5 md:p-6 border-b border-white/8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Feedback System</p>
            <h2 className="text-xl font-heading font-black text-white">Recent Reviews</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Live Feedback</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5">
                {['ID', 'Rating', 'Comment', 'Booking Reference', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-600">
                        <MessageSquare size={36} />
                        <p className="text-sm font-medium">No reviews available in this category</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review, i) => (
                    <motion.tr
                      key={review.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.3 }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-200 group"
                    >
                      {/* Review ID */}
                      <td className="px-6 py-4">
                        <div className="font-mono text-[10px] text-zinc-400 bg-white/5 w-fit px-2 py-1 rounded border border-white/8">
                          {review.id.slice(0, 12)}...
                        </div>
                      </td>

                      {/* Rating Stars */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              size={12}
                              className={idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}
                            />
                          ))}
                          <span className="ml-1.5 text-xs font-bold text-white">{review.rating}</span>
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs text-sm text-zinc-300 line-clamp-2 leading-relaxed italic">
                          "{review.comment}"
                        </div>
                      </td>

                      {/* Booking ID */}
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-2 py-1 rounded w-fit">
                          BK-{review.booking_id.slice(0, 8).toUpperCase()}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {format(parseISO(review.created_at), 'dd MMM yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetails(review)}
                            className="h-8 w-8 p-0 border-white/10 hover:bg-white/5 text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenDelete(review)}
                            className="h-8 w-8 p-0 bg-transparent hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 transition-all"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredReviews.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <p className="text-xs text-zinc-600 font-medium">
              Showing <span className="text-zinc-400">{filteredReviews.length}</span> platform reviews
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
              Verified Feedback <Icon name="CheckCircleIcon" size={14} className="text-emerald-500" />
            </div>
          </div>
        )}
      </motion.div>

      {/* ── View Details Dialog ── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0a0f] border-white/10 text-white overflow-hidden p-0 gap-0">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          
          <DialogHeader className="p-6 pb-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                  <Info className="text-indigo-400" size={20} />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg sm:text-xl font-heading font-black tracking-tight truncate">Review Details</DialogTitle>
                  <DialogDescription className="text-zinc-500 text-xs truncate">Complete feedback analysis</DialogDescription>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest sm:text-right w-full">Review ID</p>
                <Badge variant="outline" title={selectedReview?.id} className="border-white/10 bg-white/5 text-zinc-400 font-mono text-[10px] py-1 px-3 whitespace-nowrap">
                  {selectedReview?.id?.slice(0, 8)}...{selectedReview?.id?.slice(-8)}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Main Content */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-white/[0.03] rounded-2xl p-4 border border-white/5 items-start sm:items-center">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Overall Rating</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          size={18}
                          className={idx < (selectedReview?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-800'}
                        />
                      ))}
                    </div>
                    <span className="text-2xl font-black text-white leading-none">
                      {selectedReview?.rating}.0
                    </span>
                  </div>
                </div>
                <div className="sm:text-right space-y-1.5 relative">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Submitted Date</p>
                  <div className="flex items-center sm:justify-end gap-2 text-zinc-300 font-medium">
                    <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                      <Calendar size={14} className="text-indigo-400" />
                    </div>
                    <span className="text-sm tracking-wide">
                      {selectedReview && format(parseISO(selectedReview.created_at), 'dd MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Guest Comment</p>
                <p className="text-sm text-zinc-300 italic leading-relaxed">
                  "{selectedReview?.comment}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Booking Context</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                      BK
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        {selectedReview?.booking_id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-medium">Reference ID</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Platform Status</p>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Shield size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Verified Review</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-medium">Authenticity confirmed</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5">
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0f] border-rose-500/20 text-white overflow-hidden p-0 gap-0">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />
          
          <DialogHeader className="p-6 pb-0 text-center sm:text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="text-rose-400" size={24} />
            </div>
            <DialogTitle className="text-xl font-heading font-black tracking-tight">Delete Review?</DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm mt-2">
              This action cannot be undone. The review and its rating will be permanently removed from the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/10">
              <div className="flex items-start gap-3">
                <Trash2 className="text-rose-500 mt-0.5 shrink-0" size={16} />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-rose-400/80 uppercase tracking-widest">Review to remove</p>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    "{selectedReview?.comment}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={isDeleting}
              onClick={handleDeleteReview}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewList;
