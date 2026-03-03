"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Apply no top padding for homepage, auth, and signup to allow image/background to underlay the transparent header
    const isTransparentHeader = pathname === '/' || pathname === '/homepage' || pathname === '/auth' || pathname === '/signup';

    return (
        <div className={`flex-grow ${isTransparentHeader ? '' : 'pt-[100px]'}`}>
            {children}
        </div>
    );
}
