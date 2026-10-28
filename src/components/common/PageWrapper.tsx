"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import WebNotificationManager from '../notifications/WebNotificationManager';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Apply no top padding for homepage, auth, signup, admin-panel, guest booking flow, about, and contact
    const isTransparentHeader = pathname === '/' || pathname === '/homepage' || pathname === '/guest-booking-flow' || pathname === '/about' || pathname === '/contact';
    const isAdminPanel = pathname.startsWith('/admin-panel');

    return (
        <div className={`flex-grow ${isTransparentHeader || isAdminPanel ? '' : 'pt-[100px]'}`}>
            {children}
            <WebNotificationManager />
        </div>
    );
}
