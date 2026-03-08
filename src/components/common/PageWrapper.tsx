"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Apply no top padding for homepage, auth, signup, and admin-panel (admin has its own layout)
    const isTransparentHeader = pathname === '/' || pathname === '/homepage' || pathname === '/auth' || pathname === '/signup';
    const isAdminPanel = pathname.startsWith('/admin-panel');

    return (
        <div className={`flex-grow ${isTransparentHeader || isAdminPanel ? '' : 'pt-[100px]'}`}>
            {children}
        </div>
    );
}
