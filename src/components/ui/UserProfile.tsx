'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOutUser } from '@/lib/auth-actions';
import Icon from '@/components/ui/AppIcon';

interface UserProfileProps {
  session: any;
}

const UserProfile = ({ session }: UserProfileProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && event.target instanceof Element && !event.target.closest('.relative')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const secondaryNavItems = [{ name: 'Profile', path: '/user-profile', icon: 'UserIcon' }];
  if (session?.user?.role === 'Admin') {
    secondaryNavItems.push({ name: 'Admin', path: '/admin-panel', icon: 'Cog6ToothIcon' });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg text-text-secondary hover:bg-muted hover:text-foreground transition-all duration-300"
      >
        <Icon name="UserCircleIcon" size={20} />
        <span className="font-heading font-medium">{session.user.name}</span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-brand-md border border-border transition-all duration-300">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 hover:bg-muted transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg text-text-secondary"
            >
              <Icon name={item.icon} size={20} />
              <span className="font-heading font-medium">{item.name}</span>
            </Link>
          ))}
          <button
            onClick={() => signOutUser()}
            className="flex items-center space-x-3 px-4 py-3 hover:bg-muted transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg text-text-secondary"
          >
            <Icon name="ArrowLeftOnRectangleIcon" size={20} />
            <span className="font-heading font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
