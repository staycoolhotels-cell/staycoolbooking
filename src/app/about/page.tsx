'use client';

import React from 'react';

import { motion } from 'framer-motion';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface FeatureListItemProps {
  icon: string;
  title: string;
  children: React.ReactNode;
  fromLeft?: boolean;
}

// --- A component for the staggered feature list ---
const FeatureListItem = ({ icon, title, children, fromLeft = true }: FeatureListItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: fromLeft ? -50 : 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
    viewport={{ once: true, amount: 0.4 }}
    className="flex items-start gap-6"
  >
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full border-2 border-primary/20">
      <Icon name={icon} size={24} className="text-primary" />
    </div>
    <div>
      <h3 className="font-heading text-xl font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{children}</p>
    </div>
  </motion.div>
);

const AboutUsContent = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: 'easeOut' },
    viewport: { once: true, amount: 0.3 },
  } as const;

  return (
    <div className="bg-background text-text-primary overflow-x-hidden">
      <div className="container mx-auto px-4 py-24 pt-48">
        {/* --- Free-form Opening --- */}
        <div className="relative h-[60vh] mb-40">
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute top-10 left-0 text-6xl md:text-8xl font-heading font-black z-20"
          >
            The Art
            <br />
            of the Stay.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0 0)' }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
            className="absolute top-0 right-0 w-[70%] h-[80%]"
          >
            <AppImage
              src="https://images.unsplash.com/photo-1644757256739-7782a59712aa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDE4fHx8ZW58MHx8fHx8"
              alt="Stylish modern architecture"
              fill={true}
              objectFit="cover"
              className="rounded-bl-[4rem]"
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-0 left-0 md:left-1/3 max-w-md text-lg text-text-secondary leading-relaxed z-10 p-8 bg-background/80 backdrop-blur-sm rounded-tr-[2rem]"
          >
            We believe travel is not just about where you go, but how you feel. StayCool is a
            curation of the world's most exceptional properties, each chosen to inspire
            unforgettable moments.
          </motion.p>
        </div>

        {/* --- Our Ethos Section --- */}
        <div className="relative h-[80vh] mb-40">
          <motion.div {...fadeIn} className="absolute inset-0 w-full h-full">
            <AppImage
              src="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1974&auto=format&fit=crop"
              alt="Luxury poolside"
              fill={true}
              objectFit="cover"
              className="rounded-2xl"
            />
            <div className="absolute inset-0 bg-black/40 rounded-2xl"></div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}
            className="absolute bottom-10 left-10 max-w-lg p-8"
          >
            <h2 className="text-4xl font-heading font-bold mb-4 text-white">Our Ethos.</h2>
            <p className="text-xl text-white/80 leading-relaxed">
              Our philosophy is simple: travel should be transformative. We champion properties with
              soul, hosts with passion, and experiences that leave a lasting impression.
            </p>
          </motion.div>
        </div>

        {/* --- The StayCool Difference Section --- */}
        <div className="max-w-3xl mx-auto mb-40">
          <h2 className="font-heading text-4xl font-bold text-center mb-20">
            The StayCool Difference.
          </h2>
          <div className="space-y-16">
            <FeatureListItem icon="ShieldCheck" title="Verified Quality" fromLeft={true}>
              Every property is meticulously vetted against a 100-point checklist, ensuring it meets
              our stringent standards for luxury, comfort, and safety.
            </FeatureListItem>
            <FeatureListItem icon="Sparkles" title="Exclusive Access" fromLeft={false}>
              Discover a curated collection of unique homes, villas, and boutique stays you won't
              find anywhere else, each with its own story to tell.
            </FeatureListItem>
            <FeatureListItem icon="ConciergeBell" title="24/7 Concierge" fromLeft={true}>
              From pre-arrival arrangements to local recommendations, our dedicated concierge team
              is always on hand to perfect your journey.
            </FeatureListItem>
          </div>
        </div>

        {/* --- Meet The Team Section --- */}
        <div className="relative mb-20">
          <h2 className="font-heading text-4xl font-bold text-center mb-20">Our Visionaries.</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.1 }}
              className="relative h-64 rounded-lg overflow-hidden mt-10"
            >
              <AppImage
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887"
                alt="CEO"
                fill={true}
                objectFit="cover"
              />
            </motion.div>
            <motion.div
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.2 }}
              className="relative h-64 rounded-lg overflow-hidden"
            >
              <AppImage
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887"
                alt="Head of Curation"
                fill={true}
                objectFit="cover"
              />
            </motion.div>
            <motion.div
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.3 }}
              className="relative h-64 rounded-lg overflow-hidden mt-20"
            >
              <AppImage
                src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1887"
                alt="Lead Designer"
                fill={true}
                objectFit="cover"
              />
            </motion.div>
            <motion.div
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.4 }}
              className="relative h-64 rounded-lg overflow-hidden mt-5"
            >
              <AppImage
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887"
                alt="CTO"
                fill={true}
                objectFit="cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-background">
      
      <AboutUsContent />
    </main>
  );
}
