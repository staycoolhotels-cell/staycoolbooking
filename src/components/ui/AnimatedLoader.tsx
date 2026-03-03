'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedLoaderProps {
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
    fullScreen = false,
    size = 'md',
    text = 'Loading...',
    className = '',
}) => {
    // Size mapping
    const sizeMap = {
        sm: 40,
        md: 80,
        lg: 120,
    };

    const dimension = sizeMap[size];
    // Calculate relative sizes for the blob effect
    const blobSize = dimension / 2.5;

    const LoaderContent = () => (
        <div className={`flex flex-col items-center justify-center ${className}`}>

            {/* The Liquid/Gooey Container */}
            <div
                className="relative flex items-center justify-center"
                style={{ width: dimension, height: dimension }}
            >
                {/* SVG Filter for Gooey Effect */}
                <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <filter id={`goo-${size}`}>
                            <feGaussianBlur in="SourceGraphic" stdDeviation={size === 'sm' ? "4" : "8"} result="blur" />
                            <feColorMatrix
                                in="blur"
                                mode="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                                result="goo"
                            />
                            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                        </filter>

                        <radialGradient id="liquidGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#0284c7" />
                        </radialGradient>
                    </defs>
                </svg>

                {/* Applying the filter to this container */}
                <div
                    className="relative w-full h-full flex items-center justify-center"
                    style={{ filter: `url(#goo-${size})` }}
                >
                    {/* Central Anchor Blob */}
                    <motion.div
                        className="absolute bg-sky-500 rounded-full"
                        style={{ width: blobSize, height: blobSize }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Orbiting Blob 1 */}
                    <motion.div
                        className="absolute bg-sky-400 rounded-full"
                        style={{ width: blobSize * 0.8, height: blobSize * 0.8 }}
                        animate={{
                            x: [0, dimension / 2.2, 0, -dimension / 2.2, 0],
                            y: [-dimension / 2.2, 0, dimension / 2.2, 0, -dimension / 2.2],
                            scale: [1, 0.8, 1, 0.8, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Orbiting Blob 2 */}
                    <motion.div
                        className="absolute bg-sky-600 rounded-full"
                        style={{ width: blobSize * 0.7, height: blobSize * 0.7 }}
                        animate={{
                            x: [0, -dimension / 3, 0, dimension / 3, 0],
                            y: [dimension / 3, 0, -dimension / 3, 0, dimension / 3],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
                    />

                    {/* Orbiting Blob 3 */}
                    <motion.div
                        className="absolute bg-sky-300 rounded-full"
                        style={{ width: blobSize * 0.6, height: blobSize * 0.6 }}
                        animate={{
                            x: [0, dimension / 2.5, 0, -dimension / 2.5, 0],
                            y: [0, -dimension / 4, 0, dimension / 4, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* Outer Tech Ring (to ground the liquid) */}
                {!fullScreen && size !== 'sm' && (
                    <motion.div
                        className="absolute inset-0 border border-sky-500/20 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, ease: "linear", repeat: Infinity }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-sky-500/50 rounded-full" />
                    </motion.div>
                )}
            </div>

            {/* Loading Text */}
            {text && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`mt-8 flex flex-col items-center gap-2 ${className}`}
                >
                    <span className="text-sm font-black text-white uppercase tracking-[0.5em] mb-1">
                        StayCool Booking
                    </span>
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`font-heading text-sky-400/80 font-bold uppercase tracking-[0.3em] ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'
                            }`}
                    >
                        LOADING...
                    </motion.span>
                </motion.div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] backdrop-blur-3xl">
                {/* Deep Atmospheric Background */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <div className="w-[60vw] h-[60vw] bg-sky-900/10 rounded-full blur-[100px] animate-pulse-slow" />
                </div>
                <LoaderContent />
            </div>
        );
    }

    return <LoaderContent />;
};

export default AnimatedLoader;
