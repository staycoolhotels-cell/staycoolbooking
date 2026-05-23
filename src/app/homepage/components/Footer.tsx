import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact Us', href: '/contact' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Safety Information', href: '/safety' },
      { name: 'Cancellation Policy', href: '/cancellation' },
    ],
    hosting: [
      { name: 'Become a Host', href: '/host-dashboard' },
      { name: 'Community Forum', href: '/community' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/share/1QmJET9fPo/' },
    { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/staycoolbooking?igsh=MWRmejA2ZTVndTNodw==' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@staycoolbooking?si=HT7aPekMDit1XgND' },
  ];

  return (
    <footer className="bg-[#080808] border-t border-zinc-900 text-zinc-400">
      <div className="w-full px-8 md:px-20 pt-8 pb-28 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

          <div className="lg:col-span-1">
            <div className="flex items-start">
              <Link href="/" className="relative block w-[150px] h-[35px] sm:w-[220px] sm:h-[45px]">
                <AppImage
                  src="/assets/Picsart_26-03-22_23-32-24-684.png"
                  alt="StayCool Booking"
                  fill
                  objectFit="contain"
                  style={{ objectPosition: 'left' }}
                />
              </Link>
              <span className="text-[14px] sm:text-[18px] text-sky-400 font-bold ml-1 -mt-1.5 sm:-mt-2.5">®</span>
            </div>
            <p className="font-sans mt-4 text-zinc-500">
              Discover unique stays and authentic travel experiences across the globe.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-sky-600 hover:text-white transition-colors group"
                    aria-label={social.name}
                  >
                    <IconComponent size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-heading text-lg font-bold mb-4 text-zinc-100">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="font-sans text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-heading text-lg font-bold mb-4 text-zinc-100">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="font-sans text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h3 className="font-heading text-lg font-bold mb-4 text-zinc-100">Hosting</h3>
              <ul className="space-y-3">
                {footerLinks.hosting.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="font-sans text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between">
          <p className="font-sans text-zinc-600">
            &copy; {currentYear} StayCool Booking. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="font-sans text-zinc-600 hover:text-zinc-400">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-sans text-zinc-600 hover:text-zinc-400">
              Terms of Service
            </Link>
            <Link href="/cancellation" className="font-sans text-zinc-600 hover:text-zinc-400">
              Cancellation Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
