'use client';

import React, { useState, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Review {
  id: number;
  guestName: string;
  guestAvatar: string;
  guestAvatarAlt: string;
  rating: number;
  date: string;
  comment: string;
  images?: Array<{ url: string; alt: string }>;
  hostResponse?: {
    message: string;
    date: string;
  };
  isVerifiedStay: boolean;
}

interface CategoryRating {
  name: string;
  score: number;
  icon: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  categoryRatings?: CategoryRating[];
  badges?: string[];
}

const ReviewsSection = ({ reviews, averageRating, totalReviews, categoryRatings, badges }: ReviewsSectionProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const toggleReviews = () => {
    setShowAll(!showAll);
  };

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-xl p-4 md:p-8 border border-border">
        <div className="h-48 md:h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* ── Header: Rating + Guest Favourite ── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 mb-6 md:mb-10 pb-6 md:pb-10 border-b border-white/10">
        {/* Big rating */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="relative flex items-center justify-center">
            <img src="/assets/laurel-left.png" alt="" className="w-8 md:w-12 opacity-70 mr-2" />
            <span className="text-5xl md:text-7xl font-extrabold text-white leading-none">
              {averageRating.toFixed(2)}
            </span>
            <img src="/assets/laurel-right.png" alt="" className="w-8 md:w-12 opacity-70 ml-2" />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Icon
                key={i}
                name="StarIcon"
                size={14}
                className={i < Math.round(averageRating) ? 'text-yellow-400' : 'text-white/20'}
                variant={i < Math.round(averageRating) ? 'solid' : 'outline'}
              />
            ))}
          </div>
          <span className="text-xs text-white/40 mt-1 font-medium">{totalReviews} reviews</span>
        </div>

        {/* Guest favourite text */}
        <div className="text-center sm:text-left">
          <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Guest favourite
          </h2>
          <p className="text-xs md:text-sm text-white/50 mt-1 max-w-xs leading-relaxed">
            This home is in the <span className="font-bold text-white/80">top 10%</span> of eligible listings based on ratings, reviews and reliability.
          </p>
          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {badges.map((badge, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white/[0.06] border border-white/10 rounded-full text-xs font-medium text-white/70"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Category Ratings: horizontal bar layout ── */}
      {categoryRatings && categoryRatings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-6 md:mb-10 pb-6 md:pb-10 border-b border-white/10">
          {categoryRatings.map((cat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/10">
                <Icon name={cat.icon as any} size={14} className="text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white/60">{cat.name}</span>
                  <span className="text-xs font-bold text-white">{cat.score.toFixed(1)}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                    style={{ width: `${(cat.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reviews List ── */}
      {reviews.length > 0 ? (
        <>
          <h3 className="text-sm md:text-base font-semibold text-white/40 uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
            <Icon name="ChatBubbleLeftRightIcon" size={14} />
            <span>Guest Reviews</span>
            <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1 ml-2" />
          </h3>
          <div className="space-y-5 md:space-y-8">
            {reviews.slice(0, showAll ? reviews.length : 2).map((review) => (
              <div key={review.id} className="border-b border-white/[0.06] pb-5 md:pb-8 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 relative w-9 h-9 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/10 bg-white/[0.05]">
                    <AppImage src={review.guestAvatar} alt={review.guestAvatarAlt} fill />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center flex-wrap gap-2 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate">{review.guestName}</h4>
                        {review.isVerifiedStay && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full flex-shrink-0">
                            <Icon name="CheckBadgeIcon" size={11} className="text-green-400" variant="solid" />
                            <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Icon
                            key={i}
                            name="StarIcon"
                            size={11}
                            className={i < review.rating ? 'text-yellow-400' : 'text-white/20'}
                            variant={i < review.rating ? 'solid' : 'outline'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-white/40 mb-2">{review.date}</p>
                    <p className="text-xs md:text-sm text-white/70 leading-relaxed">{review.comment}</p>

                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {review.images.map((image, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/[0.05]">
                            <AppImage src={image.url} alt={image.alt} fill className="hover:scale-110 transition-transform duration-300" />
                          </div>
                        ))}
                      </div>
                    )}

                    {review.hostResponse && (
                      <div className="mt-3 p-3 bg-white/[0.03] rounded-xl border-l-2 border-primary/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="ChatBubbleLeftRightIcon" size={13} className="text-primary" />
                          <span className="text-xs font-semibold text-white/70">Host Response</span>
                          <span className="text-[10px] text-white/30">• {review.hostResponse.date}</span>
                        </div>
                        <p className="text-xs text-white/50 italic">"{review.hostResponse.message}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length > 2 && (
            <div className="mt-8 text-center">
              <button
                onClick={toggleReviews}
                className="group relative px-8 py-3 bg-white/[0.05] border border-white/10 text-white/70 rounded-2xl text-sm font-bold hover:bg-white/[0.1] hover:text-white transition-all duration-300 active:scale-95 flex items-center gap-3 mx-auto overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative z-10 uppercase tracking-widest">
                  {showAll ? 'Show Fewer Reviews' : `Show All ${reviews.length} Reviews`}
                </span>
                <div className={`relative z-10 transition-transform duration-500 ${showAll ? 'rotate-180' : ''}`}>
                  <Icon name="ChevronDownIcon" size={16} className="text-yellow-500/50 group-hover:text-yellow-400" />
                </div>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 md:py-12">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto mb-3">
            <Icon name="ChatBubbleLeftRightIcon" size={22} className="text-white/30" />
          </div>
          <p className="text-sm text-white/40 font-medium">No reviews yet</p>
          <p className="text-xs text-white/25 mt-1">Be the first to leave a review!</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
