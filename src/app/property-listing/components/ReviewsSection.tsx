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

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

const ReviewsSection = ({ reviews, averageRating, totalReviews }: ReviewsSectionProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState(3);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const loadMoreReviews = () => {
    setVisibleReviews((prev) => Math.min(prev + 3, reviews.length));
  };

  const ratingDistribution = [
    { stars: 5, count: 145, percentage: 72 },
    { stars: 4, count: 38, percentage: 19 },
    { stars: 3, count: 12, percentage: 6 },
    { stars: 2, count: 4, percentage: 2 },
    { stars: 1, count: 2, percentage: 1 },
  ];

  return (
    <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-heading font-bold text-foreground">Guest Reviews</h2>
        <div className="flex items-center space-x-2">
          <Icon name="StarIcon" size={24} className="text-warning" variant="solid" />
          <span className="text-2xl font-heading font-bold text-foreground">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-text-secondary">({totalReviews} reviews)</span>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mb-8 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Rating Breakdown
        </h3>
        <div className="space-y-3">
          {ratingDistribution.map((item) => (
            <div key={item.stars} className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 w-16">
                <span className="text-sm font-heading font-medium text-foreground">
                  {item.stars}
                </span>
                <Icon name="StarIcon" size={16} className="text-warning" variant="solid" />
              </div>
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-heading font-medium text-text-secondary w-12 text-right">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-8">
        {reviews.slice(0, visibleReviews).map((review) => (
          <div key={review.id} className="border-b border-border pb-8 last:border-b-0">
            <div className="flex items-start space-x-4">
              {/* FIXED: Added 'relative', removed '!w-8', and set standard size */}
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

                {/* FIXED: Review Images Grid with 'relative' containers */}
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
