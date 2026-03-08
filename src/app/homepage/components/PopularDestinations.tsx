'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from './PropertyCard';
import Icon from '@/components/ui/AppIcon';

interface PropertyForCard {
    id: string;
    title: string;
    location: string;
    type: string;
    price: number;
    rating: number;
    reviews: number;
    images: { url: string; alt: string }[];
    amenities: string[];
    instantBook: boolean;
    host: { verified: boolean };
}

interface PopularDestinationsProps {
    allProperties: PropertyForCard[];
    savedProperties: string[];
    onSaveProperty: (id: string) => void;
    showTotalWithTax?: boolean;
}

// Seasonal badge config – rotates based on current month
const getSeasonalBadge = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 2 && month <= 4) return { label: 'Spring Picks 🌸', color: 'from-pink-500 to-rose-400' };
    if (month >= 5 && month <= 7) return { label: 'Summer Hotspots ☀️', color: 'from-amber-500 to-orange-400' };
    if (month >= 8 && month <= 10) return { label: 'Autumn Escapes 🍂', color: 'from-orange-600 to-amber-500' };
    return { label: 'Winter Retreats ❄️', color: 'from-sky-500 to-blue-400' };
};

const CARDS_VISIBLE = 5;

const PopularDestinations: React.FC<PopularDestinationsProps> = ({
    allProperties,
    savedProperties,
    onSaveProperty,
    showTotalWithTax = false,
}) => {
    const [showAll, setShowAll] = useState(false);
    const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

    const seasonalBadge = useMemo(() => getSeasonalBadge(), []);

    // Group all properties by city (first part before comma)
    const destinationGroups = useMemo(() => {
        const groups: Record<string, PropertyForCard[]> = {};
        allProperties.forEach((p) => {
            const city = p.location?.split(',')[0]?.trim() || 'Other';
            if (!groups[city]) groups[city] = [];
            groups[city].push(p);
        });

        // Sort destinations by property count descending – most popular first
        return Object.entries(groups)
            .filter(([, props]) => props.length > 0)
            .sort(([, a], [, b]) => b.length - a.length);
    }, [allProperties]);

    // Destination tabs (show up to 5 city tabs)
    const topDestinations = useMemo(
        () => destinationGroups.slice(0, 5),
        [destinationGroups]
    );

    // Active destination: default to first (most properties)
    const activeDestinationName = selectedDestination ?? topDestinations[0]?.[0] ?? null;
    const activeProps =
        destinationGroups.find(([city]) => city === activeDestinationName)?.[1] ?? [];

    const displayedProps = showAll ? activeProps : activeProps.slice(0, CARDS_VISIBLE);
    const hasMore = activeProps.length > CARDS_VISIBLE;

    if (topDestinations.length === 0) return null;

    return (
        <section className="w-full">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                            Popular Destinations
                        </h2>
                        {/* Seasonal badge */}
                        <span
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-400 shadow-lg"
                        >
                            {seasonalBadge.label}
                        </span>
                    </div>
                    <p className="font-sans text-base sm:text-lg text-zinc-400">
                        Trending stays in the most sought-after locations
                    </p>
                </div>

                {/* Show All / Show Less button */}
                {hasMore && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowAll((prev) => !prev)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 transition-colors text-sm font-semibold whitespace-nowrap self-start sm:self-center"
                    >
                        {showAll ? (
                            <>
                                <Icon name="ChevronUpIcon" size={16} />
                                Show Less
                            </>
                        ) : (
                            <>
                                <Icon name="Squares2X2Icon" size={16} />
                                Show All {activeProps.length} Properties
                            </>
                        )}
                    </motion.button>
                )}
            </div>

            {/* ── Destination Tabs ── */}
            {topDestinations.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-7 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {topDestinations.map(([city, props]) => {
                        const isActive = city === activeDestinationName;
                        return (
                            <button
                                key={city}
                                onClick={() => {
                                    setSelectedDestination(city);
                                    setShowAll(false);
                                }}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${isActive
                                    ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/25'
                                    : 'bg-zinc-900/50 border-zinc-700/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500'
                                    }`}
                            >
                                <span>{city}</span>
                                <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-500'
                                        }`}
                                >
                                    {props.length}
                                </span>
                                {/* Trending fire for #1 */}
                                {city === topDestinations[0][0] && (
                                    <Icon name="FireIcon" size={14} className={isActive ? 'text-white' : 'text-amber-400'} />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Stats strip ── */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 mt-4">
                <div className="flex items-center gap-1.5 text-amber-400">
                    <Icon name="FireIcon" size={16} />
                    <span className="text-sm font-semibold">Trending Now</span>
                </div>
                <div className="w-px h-4 bg-zinc-700" />
                <span className="text-sm text-zinc-500">
                    {activeProps.length} {activeProps.length === 1 ? 'property' : 'properties'} in{' '}
                    <span className="text-zinc-300 font-medium">{activeDestinationName}</span>
                </span>
                {!showAll && hasMore && (
                    <>
                        <div className="w-px h-4 bg-zinc-700" />
                        <span className="text-sm text-zinc-500">
                            Showing <span className="text-zinc-300 font-medium">{CARDS_VISIBLE}</span> of{' '}
                            <span className="text-zinc-300 font-medium">{activeProps.length}</span>
                        </span>
                    </>
                )}
            </div>

            {/* ── Property Cards Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-5">
                <AnimatePresence initial={false}>
                    {displayedProps.map((property, index) => (
                        <motion.div
                            key={property.id}
                            layout
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.96 }}
                            transition={{
                                duration: 0.35,
                                delay: index < CARDS_VISIBLE ? 0 : (index - CARDS_VISIBLE) * 0.05,
                                ease: 'easeOut',
                            }}
                        >
                            <PropertyCard
                                property={
                                    showTotalWithTax
                                        ? { ...property, price: property.price * 1.18 }
                                        : property
                                }
                                onSaveProperty={onSaveProperty}
                                isSaved={savedProperties.includes(property.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Bottom Show All / Less CTA (always visible for mobile) ── */}
            {hasMore && (
                <div className="mt-8 flex justify-center">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowAll((prev) => !prev)}
                        className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${showAll
                            ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                            : 'bg-gradient-to-r from-sky-500 to-sky-400 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50'
                            }`}
                    >
                        {showAll ? (
                            <>
                                <Icon name="ChevronUpIcon" size={16} />
                                Show Less
                            </>
                        ) : (
                            <>
                                <Icon name="Squares2X2Icon" size={16} />
                                Show All {activeProps.length} Properties in {activeDestinationName}
                            </>
                        )}
                    </motion.button>
                </div>
            )}
        </section>
    );
};

export default PopularDestinations;
