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
            {/* Optimized Loader */}
            <div className="relative flex items-center justify-center" style={{ width: dimension, height: dimension }}>
                <motion.div
                    className="absolute inset-0 border-2 border-sky-500/20 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-0 border-t-2 border-sky-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="w-1/3 h-1/3 bg-sky-500 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)]"
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Loading Text */}
            {text && (
                <div className={`mt-8 flex flex-col items-center gap-2 ${className}`}>
                    <span className="text-sm font-black text-white uppercase tracking-[0.5em] mb-1">
                        StayCool Booking
                    </span>
                    <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`font-heading text-sky-400/80 font-bold uppercase tracking-[0.3em] ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}`}
                    >
                        {text.toUpperCase()}
                    </motion.span>
                </div>
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
