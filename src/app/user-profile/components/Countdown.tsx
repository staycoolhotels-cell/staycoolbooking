'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Set the real value immediately after mount to avoid SSR hydration mismatch
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
    if (value < 0) return null;

    return (
      <div key={interval} className="flex flex-col items-center">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex justify-center items-center">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-4xl font-bold text-white tabular-nums"
          >
            {String(value).padStart(2, '0')}
          </motion.div>
        </div>
        <div className="text-[10px] sm:text-xs uppercase text-sky-300/60 mt-1 tracking-wider font-semibold">{interval}</div>
      </div>
    );
  });

  return <div className="flex justify-center gap-2 sm:gap-4">{timerComponents}</div>;
};

export default Countdown;
