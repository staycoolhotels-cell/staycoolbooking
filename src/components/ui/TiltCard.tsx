'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    tiltMaxAngleX?: number;
    tiltMaxAngleY?: number;
    perspective?: number;
    scale?: number;
    transitionSpeed?: number;
    glareEnable?: boolean;
    glareMaxOpacity?: number;
    glareColor?: string;
    glarePosition?: 'all' | 'top' | 'bottom';
}

const TiltCard = ({
    children,
    className = '',
    tiltMaxAngleX = 10,
    tiltMaxAngleY = 10,
    perspective = 1000,
    scale = 1.05,
    transitionSpeed = 400,
    glareEnable = true,
    glareMaxOpacity = 0.4,
    glareColor = 'rgba(255, 255, 255, 0.4)',
    glarePosition = 'all',
}: TiltCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState(false);

    // Mouse position values
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation for tilt
    const springConfig = { damping: 30, stiffness: 400, mass: 1 }; // High stiffness for responsiveness

    // Transform mouse position to rotation values
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [tiltMaxAngleX, -tiltMaxAngleX]), springConfig);
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-tiltMaxAngleY, tiltMaxAngleY]), springConfig);

    // Glare effect values
    const glareX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), springConfig);
    const glareY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), springConfig);
    const glareOpacity = useSpring(useTransform(
        x,
        [-0.5, 0, 0.5],
        [glareMaxOpacity, 0, glareMaxOpacity]
    ), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Normalize coordinates from -0.5 to 0.5
        const mouseX = (e.clientX - rect.left) / width - 0.5;
        const mouseY = (e.clientY - rect.top) / height - 0.5;

        x.set(mouseX);
        y.set(mouseY);
    };

    const handleMouseEnter = () => {
        setHover(true);
    };

    const handleMouseLeave = () => {
        setHover(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            className={`relative transform-style-3d ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: `${perspective}px`,
                transformStyle: 'preserve-3d',
            }}
            initial={{ scale: 1 }}
            whileHover={{ scale }}
            transition={{ duration: transitionSpeed / 1000 }}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className="w-full h-full"
            >
                {children}

                {/* Glare Effect */}
                {glareEnable && (
                    <motion.div
                        className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-[inherit]"
                        style={{
                            opacity: hover ? glareOpacity : 0,
                            background: `radial-gradient(circle at ${glareX}% ${glareY}%, ${glareColor}, transparent 50%)`,
                            mixBlendMode: 'overlay', // or 'screen' depending on preference
                        }}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};

export default TiltCard;
