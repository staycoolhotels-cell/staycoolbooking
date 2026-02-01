'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

const navLinks = [
  { href: '/admin-panel', label: 'Dashboard', icon: 'ChartBarIcon' },
  {
    href: '/admin-panel/property-management',
    label: 'Property Management',
    icon: 'HomeModernIcon',
  },
  { href: '/admin-panel/financials', label: 'Financials', icon: 'BanknotesIcon' },
  { href: '/admin-panel/user-management', label: 'User Management', icon: 'UsersIcon' },
  { href: '/admin-panel/marketing', label: 'Marketing', icon: 'MegaphoneIcon' },
  { href: '/admin-panel/reviews', label: 'Reviews', icon: 'ChatBubbleBottomCenterTextIcon' },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              pathname === link.href
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon name={link.icon as any} size={22} />
            <span className="font-heading font-medium">{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="px-4 py-6 border-t border-border">
        <div className="flex items-center space-x-3">
          <img src="https://i.pravatar.cc/40" alt="Admin" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-heading font-semibold text-foreground">Admin User</p>
            <p className="text-sm text-text-secondary">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
