'use client';

import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import TiltCard from '@/components/ui/TiltCard';

const testimonials = [
    {
        id: 1,
        name: 'Sarah Jenkins',
        role: 'Travel Blogger',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        content: "The most seamless booking experience I've ever had. The property was exactly as described, and the host was incredibly welcoming.",
        rating: 5,
        location: 'Stayed in Manali',
    },
    {
        id: 2,
        name: 'David Chen',
        role: 'Digital Nomad',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        content: "Found the perfect workspace-friendly villa for my month-long stay. fast WiFi, great amenities, and stunning views.",
        rating: 5,
        location: 'Stayed in Goa',
    },
    {
        id: 3,
        name: 'Emily & James',
        role: 'Honeymooners',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
        content: "We couldn't have asked for a better honeymoon destination. The privacy and luxury offered were unmatched.",
        rating: 5,
        location: 'Stayed in Coorg',
    },
];

const TestimonialsSection = () => {
    return (
        <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-heading text-4xl font-bold text-zinc-100 tracking-tight">
                        Loved by Travelers
                    </h2>
                    <p className="font-sans mt-4 text-xl text-zinc-400 max-w-2xl mx-auto">
                        Don't just take our word for it. Here's what our community says about their stays.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="h-full">
                            <TiltCard className="h-full" tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} glareMaxOpacity={0.1}>
                                <div className="bg-zinc-900/40 border border-zinc-800 backdrop-blur-sm p-8 rounded-2xl h-full flex flex-col shadow-lg">
                                    {/* Rating */}
                                    <div className="flex mb-6">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Icon key={i} name="StarIcon" size={16} variant="solid" className="text-yellow-500 mr-1" />
                                        ))}
                                    </div>

                                    {/* Content */}
                                    <p className="font-sans text-zinc-300 mb-8 flex-grow leading-relaxed italic">
                                        "{testimonial.content}"
                                    </p>

                                    {/* User Info */}
                                    <div className="flex items-center mt-auto pt-6 border-t border-zinc-800">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 border border-zinc-700">
                                            <AppImage
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-heading font-bold text-zinc-100 text-sm">{testimonial.name}</h4>
                                            <p className="font-sans text-xs text-zinc-500">{testimonial.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </TiltCard>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
