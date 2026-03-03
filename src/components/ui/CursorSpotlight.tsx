'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CursorSpotlight = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Mouse position
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth circular spring physics
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Center the cursor
            mouseX.set(e.clientX - 200); // 200 is half the width (400px)
            mouseY.set(e.clientY - 200);

            if (!isVisible) setIsVisible(true);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [mouseX, mouseY, isVisible]);

    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden mix-blend-screen"
            style={{ opacity: isVisible ? 1 : 0 }}
        >
            <motion.div
                className="absolute rounded-full"
                style={{
                    left: springX,
                    top: springY,
                    width: 400,
                    height: 400,
                    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 40%, transparent 70%)',
                    filter: 'blur(20px)',
                }}
            />
        </motion.div>
    );
};

export default CursorSpotlight;
