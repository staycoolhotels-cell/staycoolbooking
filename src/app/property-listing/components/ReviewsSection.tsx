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
  const [visibleReviews, setVisibleReviews] = useState(3);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const loadMoreReviews = () => {
    setVisibleReviews((prev) => Math.min(prev + 3, reviews.length));
  };


  if (!isHydrated) {
    return (
      <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
      {/* Header with Guest Favourite */}
      <div className="flex flex-col items-center justify-center text-center mb-12 relative">
        <div className="relative mb-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center text-[80px] leading-none font-heading font-bold text-foreground">
              <span className="relative">
                {averageRating.toFixed(2)}
                <div className="absolute -left-12 top-1/2 -translate-y-1/2">
                  <img src="/assets/laurel-left.png" alt="" className="w-16 opacity-80" />
                </div>
                <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                  <img src="/assets/laurel-right.png" alt="" className="w-16 opacity-80" />
                </div>
              </span>
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-heading font-bold text-foreground">Guest favourite</h2>
            <p className="text-text-secondary text-sm mt-1 max-w-sm mx-auto">
              This home is in the <span className="font-bold text-foreground">top 10%</span> of eligible listings based on ratings, reviews and reliability
            </p>
          </div>
        </div>
      </div>

      {/* Category Ratings */}
      {categoryRatings && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-x-8 gap-y-6 mb-12 border-b border-border pb-12 overflow-x-auto">
          {categoryRatings.map((category, index) => (
            <div key={index} className="flex flex-col border-r border-border last:border-r-0 px-2 min-w-[100px]">
              <span className="text-sm font-medium text-foreground mb-1">{category.name}</span>
              <span className="text-xl font-bold text-foreground mb-2">{category.score.toFixed(1)}</span>
              <div className="mt-auto">
                <Icon name={category.icon as any} size={24} className="text-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badges/Highlights */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-12">
          {badges.map((badge, index) => (
            <div key={index} className="px-4 py-2 bg-muted rounded-full text-sm font-medium text-foreground">
              {badge}
            </div>
          ))}
        </div>
      )}


      {/* Reviews List */}
      <h3 className="text-xl font-heading font-bold text-foreground mb-6">{totalReviews} Reviews</h3>
      <div className="space-y-8">
        {reviews.slice(0, visibleReviews).map((review) => (
          <div key={review.id} className="border-b border-border pb-8 last:border-b-0">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 relative w-12 h-12 rounded-full overflow-hidden border border-border bg-muted">
                <AppImage src={review.guestAvatar} alt={review.guestAvatarAlt} fill />
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className="text-base font-heading font-semibold text-foreground">
                        {review.guestName}
                      </h4>
                      {review.isVerifiedStay && (
                        <div className="flex items-center space-x-1 px-2 py-0.5 bg-success/10 rounded-full">
                          <Icon
                            name="CheckBadgeIcon"
                            size={14}
                            className="text-success"
                            variant="solid"
                          />
                          <span className="text-[10px] font-heading font-bold text-success uppercase tracking-wider">
                            Verified Stay
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">{review.date}</p>
                  </div>

                  <div className="flex items-center space-x-0.5">
                    {[...Array(5)].map((_, index) => (
                      <Icon
                        key={index}
                        name="StarIcon"
                        size={14}
                        className={index < review.rating ? 'text-warning' : 'text-border'}
                        variant={index < review.rating ? 'solid' : 'outline'}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-foreground leading-relaxed mb-4">{review.comment}</p>

                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border bg-muted"
                      >
                        <AppImage
                          src={image.url}
                          alt={image.alt}
                          fill
                          className="hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {review.hostResponse && (
                  <div className="mt-4 p-4 bg-muted rounded-lg border-l-4 border-primary">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="ChatBubbleLeftRightIcon" size={16} className="text-primary" />
                      <span className="text-sm font-heading font-semibold text-foreground">
                        Host Response
                      </span>
                      <span className="text-xs text-text-secondary">
                        • {review.hostResponse.date}
                      </span>
                    </div>
                    <p className="text-sm text-foreground italic">
                      "{review.hostResponse.message}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleReviews < reviews.length && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMoreReviews}
            className="px-8 py-3 bg-muted text-foreground rounded-xl font-heading font-bold hover:bg-muted/80 transition-all active:scale-95"
          >
            Show More ({reviews.length - visibleReviews} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
