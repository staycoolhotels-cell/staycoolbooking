import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Blog', href: '/blog' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Safety Information', href: '/safety' },
      { name: 'Cancellation Options', href: '/cancellation' },
    ],
    hosting: [
      { name: 'Become a Host', href: '/host-dashboard' },
      { name: 'Host Resources', href: '/host-resources' },
      { name: 'Community Forum', href: '/community' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: 'ShareIcon', href: '#' },
    { name: 'Twitter', icon: 'ChatBubbleLeftIcon', href: '#' },
    { name: 'Instagram', icon: 'CameraIcon', href: '#' },
    { name: 'LinkedIn', icon: 'BriefcaseIcon', href: '#' },
  ];

  return (
    <footer className="bg-gradient-to-br from-gradient-background-from to-gradient-background-to text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="font-heading text-3xl font-bold text-accent">
              StayCool Booking
            </Link>
            <p className="font-sans mt-4 text-text-secondary">
              Discover unique stays and authentic travel experiences across the globe.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-gradient-to-br from-gradient-card-from to-gradient-card-to rounded-full flex items-center justify-center hover:bg-accent hover:text-foreground transition-colors"
                  aria-label={social.name}
                >
                  <Icon name={social.icon} size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading text-lg font-bold mb-4 text-accent">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-lg font-bold mb-4 text-accent">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-lg font-bold mb-4 text-accent">Hosting</h3>
            <ul className="space-y-3">
              {footerLinks.hosting.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="font-sans text-text-secondary hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between">
          <p className="font-sans text-text-secondary">
            &copy; {currentYear} StayCool Booking. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="font-sans text-text-secondary hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-sans text-text-secondary hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
