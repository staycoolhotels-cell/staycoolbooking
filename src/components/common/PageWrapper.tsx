"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import WebNotificationManager from '../notifications/WebNotificationManager';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Apply no top padding for homepage, auth, signup, admin-panel, and guest booking flow
    const isTransparentHeader = pathname === '/' || pathname === '/homepage' || pathname === '/guest-booking-flow';
    const isAdminPanel = pathname.startsWith('/admin-panel');

    return (
        <div className={`flex-grow ${isTransparentHeader || isAdminPanel ? '' : 'pt-[100px]'}`}>
            {children}
            <WebNotificationManager />
        </div>
    );
}
