'use client';

import React from 'react';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="flex flex-col h-screen bg-[#050505]">
            <AdminHeader
                onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    isMobileMenuOpen={isMobileMenuOpen}
                    onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#050505] p-4 sm:p-6 md:p-8 lg:ml-64">
                    {children}
                </main>
            </div>
        </div>
    );
}
