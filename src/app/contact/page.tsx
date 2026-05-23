'use client';

import React from 'react';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { toast } from 'sonner';

const ContactPage = () => {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AppImage
          src="https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop"
          alt="Luxury modern interior"
          fill={true}
          objectFit="cover"
          className="opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      </div>

      

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center min-h-screen pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-black text-text-primary mb-3 tracking-tighter">
            Contact Us
          </h1>
          <p className="max-w-xl mx-auto text-lg text-text-secondary">
            Have a question or a special request? Our team is here to provide bespoke assistance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
          className="w-full max-w-3xl bg-surface/5 backdrop-blur-2xl border border-primary/20 rounded-3xl p-6 md:p-10"
        >
          <form 
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              
              console.log('Contact inquiry:', data);
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              toast.success('Inquiry sent successfully! Our team will contact you soon.');
              (e.target as HTMLFormElement).reset();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="peer w-full bg-transparent border-b-2 border-primary/20 pt-2 text-base text-text-primary focus:border-primary focus:outline-none transition-colors"
                  placeholder=" "
                />
                <label
                  htmlFor="name"
                  className="absolute left-0 -top-4 text-xs text-text-secondary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-primary"
                >
                  Full Name
                </label>
              </div>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="peer w-full bg-transparent border-b-2 border-primary/20 pt-2 text-base text-text-primary focus:border-primary focus:outline-none transition-colors"
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className="absolute left-0 -top-4 text-xs text-text-secondary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-primary"
                >
                  Email Address
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="peer w-full bg-transparent border-b-2 border-primary/20 pt-2 text-base text-text-primary focus:border-primary focus:outline-none transition-colors"
                  placeholder=" "
                />
                <label
                  htmlFor="phone"
                  className="absolute left-0 -top-4 text-xs text-text-secondary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-primary"
                >
                  Phone Number (Optional)
                </label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="peer w-full bg-transparent border-b-2 border-primary/20 pt-2 text-base text-text-primary focus:border-primary focus:outline-none transition-colors"
                  placeholder=" "
                />
                <label
                  htmlFor="subject"
                  className="absolute left-0 -top-4 text-xs text-text-secondary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-primary"
                >
                  Subject
                </label>
              </div>
            </div>
            <div className="relative">
              <textarea
                id="message"
                name="message"
                rows={5}
                className="peer w-full bg-transparent border-b-2 border-primary/20 pt-2 text-base text-text-primary focus:border-primary focus:outline-none transition-colors"
                placeholder=" "
              ></textarea>
              <label
                htmlFor="message"
                className="absolute left-0 -top-4 text-xs text-text-secondary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-primary"
              >
                Your Message
              </label>
            </div>
            <div className="pt-6 text-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0px 0px 20px rgba(14, 165, 233, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="bg-primary text-primary-foreground font-bold py-3 px-12 rounded-full text-base transition-shadow"
              >
                Send Inquiry
              </motion.button>
            </div>
          </form>

          {/* Contact Info Icons */}
          <div className="mt-12 pt-8 border-t border-primary/20 flex flex-col sm:flex-row justify-around items-center gap-6 sm:gap-0">
            <a
              href="mailto:staycoolhotels@gmail.com"
              className="flex flex-col items-center gap-2 text-text-secondary hover:text-primary transition-colors text-center"
            >
              <Icon name="Mail" size={24} />
              <span className="text-xs">staycoolhotels@gmail.com</span>
            </a>

            <div className="flex flex-col items-center gap-2 text-text-secondary text-center">
              <Icon name="MapPin" size={24} />
              <span className="text-xs">Rasoolpet, Phirangipuram</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default ContactPage;
