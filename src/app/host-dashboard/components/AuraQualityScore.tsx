import React, { useState, useEffect, useMemo } from 'react';
import { Star, TrendingUp, DollarSign, MessageSquare } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';

interface GuestReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  property_name: string;
  property_id: string;
}

// Extend base types to match Supabase schema layout
export interface AuraQualityScoreData {
  id: string;
  property_id: string;
  property_name?: string;
  overall_score: number;
  optimization_tips: string[];
  ranking_improvement: string;
}

export interface MarketComparisonData {
  id: string;
  property_id: string;
  property_name?: string;
  your_price?: number;
  average_local_price: number;
  suggested_price: number;
  currency?: string;
}

interface AuraQualityScoreProps {
  properties?: Property[];
}

const AuraQualityScore: React.FC<AuraQualityScoreProps> = ({ properties = [] }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [auraScores, setAuraScores] = useState<AuraQualityScoreData[]>([]);
  const [marketComparisons, setMarketComparisons] = useState<MarketComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestReviews, setGuestReviews] = useState<GuestReview[]>([]);

  // Memoize property map for quick lookups
  const propertyMap = useMemo(() => {
    return properties.reduce((acc, prop) => {
      acc[prop.id] = prop;
      return acc;
    }, {} as Record<string, Property>);
  }, [properties]);

  useEffect(() => {
    const fetchData = async () => {
      if (properties.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const propertyIds = properties.map(p => p.id);

      // Fetch Guest Reviews for host's properties (using column-reference syntax for joins)
      let fetchedReviews: GuestReview[] = [];
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, property_id, reviewer_id, reviewer:users!reviewer_id(name), property:properties!property_id(title, name)')
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false });

        if (!reviewsError && reviewsData && reviewsData.length > 0) {
          fetchedReviews = reviewsData.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            reviewer_name: r.reviewer?.name || 'Guest',
            property_name: r.property?.title || r.property?.name || 'Property',
            property_id: r.property_id,
          }));
        } else {
          // Fallback: fetch reviews without joins, then fetch reviewer names separately
          const { data: simpleReviews } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at, property_id, reviewer_id')
            .in('property_id', propertyIds)
            .order('created_at', { ascending: false });

          if (simpleReviews && simpleReviews.length > 0) {
            // Get reviewer names
            const reviewerIds = [...new Set(simpleReviews.map((r: any) => r.reviewer_id).filter(Boolean))];
            const { data: reviewers } = await supabase
              .from('users')
              .select('id, name')
              .in('id', reviewerIds);
            const reviewerMap = Object.fromEntries((reviewers || []).map((u: any) => [u.id, u.name]));

            // Get property names
            const propNames = Object.fromEntries(properties.map(p => [p.id, p.title || p.name || 'Property']));

            fetchedReviews = simpleReviews.map((r: any) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              created_at: r.created_at,
              reviewer_name: reviewerMap[r.reviewer_id] || 'Guest',
              property_name: propNames[r.property_id] || 'Property',
              property_id: r.property_id,
            }));
          }
        }
      } catch (e) {
        console.warn('AuraQualityScore: reviews fetch error:', e);
      }
      setGuestReviews(fetchedReviews);

      try {
        // Fetch Aura Scores
        const { data: auraData } = await supabase
          .from('aura_quality_scores')
          .select('*')
          .in('property_id', propertyIds);

        const fetchedAura = auraData || [];
        const enrichedAura = properties.map((prop) => {
          const dbData = fetchedAura.find((item: any) => item.property_id === prop.id);
          const propName = prop.name || prop.title || 'Unknown Property';
          if (dbData) {
            return {
              ...dbData,
              property_name: propName
            };
          }
          // Fallback mock data
          const charCode = propName.charCodeAt(0) || 65;
          const currentPrice = prop.price_per_night || prop.price || 5000;
          const numBedrooms = prop.bedrooms || 1;
          const numImages = prop.images?.length || 0;

          let availableTips: string[] = [];

          // 1. Price-based tips
          if (currentPrice > 10000) {
            availableTips.push('Consider offering a premium welcome package to justify the high price point.');
            availableTips.push('Highlight luxury amenities prominently in your main listing photos.');
          } else if (currentPrice < 3000) {
            availableTips.push('Emphasize value for money and budget-friendly aspects of your location.');
            availableTips.push('Consider small, cost-effective upgrades like better lighting to increase perceived value.');
          } else {
            availableTips.push('Your pricing is competitive. Focus on gathering more positive reviews.');
            availableTips.push('Offer seasonal discounts to maintain high occupancy rates.');
          }

          // 2. Bedroom-based tips
          if (numBedrooms >= 3) {
            availableTips.push('Highlight family-friendly features and group accommodation capabilities.');
          } else if (numBedrooms === 2) {
            availableTips.push('Great for small families or friends. Mention nearby parks or attractions.');
          } else {
            availableTips.push('Perfect for solo travelers or couples. Highlight romantic or quiet workspaces.');
          }

          // 3. Image-based tips
          if (numImages < 5) {
            availableTips.push('Add more high-quality photos (aim for at least 15) to increase booking conversion.');
          } else {
            availableTips.push('Consider uploading a video tour of the property to stand out in search results.');
          }

          // 4. General variety tips
          const generalTips = [
            'Update your listing description to highlight recent local events or seasonal attractions.',
            'Consider enabling Instant Book to increase visibility in search results.',
            'Respond to guest inquiries within 1 hour to boost your response rate metric.',
            'Highlight fast Wi-Fi speeds to attract remote workers and digital nomads.',
            'Promote early check-in or late check-out options for better guest satisfaction.',
            'Provide a local guidebook with personalized restaurant recommendations.',
            'Add self check-in options to appeal to travelers arriving late.'
          ];

          // Mix property-specific tips with general tips using a deterministic seed based on property name
          const seed = propName.length + charCode;
          availableTips.push(generalTips[seed % generalTips.length]);
          availableTips.push(generalTips[(seed + 3) % generalTips.length]);
          availableTips.push(generalTips[(seed + 5) % generalTips.length]);

          // Select exactly 3 unique tips deterministically based on the property name
          const uniqueTips = Array.from(new Set(availableTips));
          const finalTips = [
            uniqueTips[seed % uniqueTips.length],
            uniqueTips[(seed + 1) % uniqueTips.length],
            uniqueTips[(seed + 2) % uniqueTips.length]
          ];

          return {
            id: `aura-mock-${prop.id}`,
            property_id: prop.id,
            property_name: propName,
            overall_score: 80 + (charCode % 15),
            optimization_tips: finalTips,
            ranking_improvement: `Potential +${(10 + (charCode % 10))}% visibility in search.`
          };
        });
        setAuraScores(enrichedAura);

        // Fetch Market Comparisons
        const { data: marketData } = await supabase
          .from('market_comparisons')
          .select('*')
          .in('property_id', propertyIds);

        const fetchedMarket = marketData || [];
        const enrichedMarket = properties.map((prop: any) => {
          const dbData = fetchedMarket.find((item: any) => item.property_id === prop.id);
          const currentPrice = prop.price_per_night || prop.price || 5000;
          const propName = prop.name || prop.title || 'Unknown Property';
          if (dbData) {
            return {
              ...dbData,
              property_name: propName,
              your_price: currentPrice,
              currency: 'INR'
            };
          }
          // Fallback mock data
          const charCode = propName.charCodeAt(0) || 65;
          const avgPrice = currentPrice * 0.9 + (charCode * 10);
          return {
            id: `market-mock-${prop.id}`,
            property_id: prop.id,
            property_name: propName,
            your_price: currentPrice,
            average_local_price: Math.round(avgPrice),
            suggested_price: Math.round(avgPrice * 0.95),
            currency: 'INR'
          };
        });
        setMarketComparisons(enrichedMarket);
      } catch (error) {
        console.error("Error fetching Aura/Market data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [properties, supabase, propertyMap]);

  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">
        Guest Ratings &amp; Reviews
      </h1>

      {/* ── GUEST REVIEWS SECTION ── */}
      <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-6 shadow-2xl mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Star size={18} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Guest Reviews</h2>
          <span className="ml-auto text-xs font-bold text-white/30 uppercase tracking-widest">
            {guestReviews.length} total
          </span>
        </div>

        {guestReviews.length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {guestReviews.map(review => (
              <div key={review.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-all">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 font-bold text-sm">
                  {review.reviewer_name.charAt(0).toUpperCase()}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{review.reviewer_name}</span>
                    <span className="text-[10px] text-white/30">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={13} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
                    ))}
                    <span className="text-xs text-amber-400 font-bold ml-1">{review.rating}.0</span>
                  </div>
                  <p className="text-[10px] text-sky-400/70 mb-1">{review.property_name}</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <MessageSquare size={36} className="text-zinc-700" />
            <p className="text-zinc-500 text-sm">No guest reviews yet.</p>
            <p className="text-zinc-700 text-xs">Reviews from guests will appear here after their stay.</p>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-zinc-100 mb-4">
        Listing Optimization
      </h2>

      {loading ? (
        <div className="text-white/50 animate-pulse">Analyzing properties...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Aura Quality Scores */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Property Aura Scores</h2>
            {auraScores.length > 0 ? (
              auraScores.map((aura) => (
                <div key={aura.id} className="mb-4 p-4 border border-white/10 rounded-xl">
                  <h3 className="font-semibold text-lg text-white flex items-center">
                    <Star size={20} className="mr-2 text-yellow-500" />
                    {aura.property_name} - Score: {aura.overall_score}/100
                  </h3>
                  <p className="text-sm text-zinc-400 mt-2">Optimization Tips:</p>
                  <ul className="list-disc list-inside text-xs text-white/50">
                    {aura.optimization_tips?.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                  {aura.ranking_improvement && (
                    <p className="text-xs text-sky-400 mt-2">
                      Expected Impact: {aura.ranking_improvement}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-white/50 text-sm">No Aura Quality Scores generated yet.</p>
            )}
          </div>

          {/* Market Comparison */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Market Comparison (Bento Tile)</h2>
            {marketComparisons.length > 0 ? (
              marketComparisons.map((comparison) => (
                <div
                  key={comparison.id}
                  className="mb-4 p-4 border border-white/10 rounded-xl grid grid-cols-2 gap-2"
                >
                  <div className="col-span-2">
                    <h3 className="font-semibold text-lg text-white">{comparison.property_name}</h3>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Your Price:</p>
                    <p className="text-lg font-bold text-sky-400 flex items-center">
                      ₹{comparison.your_price}{' '}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Avg. Local Price:</p>
                    <p className="text-lg font-bold text-white flex items-center">
                      ₹{comparison.average_local_price}{' '}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-zinc-400">Suggested Price:</p>
                    <p className="text-xl font-bold text-green-600 flex items-center">
                      <TrendingUp size={20} className="mr-1" /> ₹{comparison.suggested_price}{' '}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/50 text-sm">No market comparison data available automatically.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuraQualityScore;
