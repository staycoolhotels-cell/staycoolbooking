'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabaseClient';
import { signOutUser } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const adminNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'Community', path: '/community' },
    { name: 'About', path: '/about' },
];

interface AdminHeaderProps {
    onMenuToggle: () => void;
    isMobileMenuOpen: boolean;
}

const AdminHeader = ({ onMenuToggle, isMobileMenuOpen }: AdminHeaderProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const [adminName, setAdminName] = useState('Admin');
    const { scrollY } = useScroll();

    // Match homepage header cinematic scroll effect
    const headerBg = useTransform(
        scrollY,
        [0, 80],
        ['rgba(10, 10, 15, 0.85)', 'rgba(10, 10, 15, 1)']
    );

    useEffect(() => {
        const fetchAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', user.id)
                    .single();
                setAdminName(profile?.name || user.user_metadata?.name || 'Admin');
            }
        };
        fetchAdmin();
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            React.startTransition(() => { signOutUser(); });
            router.push('/auth');
        } catch {
            router.push('/auth');
        }
    };

    return (
        <>
            <motion.header
                style={{ backgroundColor: headerBg }}
                className="flex-shrink-0 h-[64px] border-b border-white/10 flex items-center px-4 sm:px-8 z-[200] backdrop-blur-md"
            >
                <div className="w-full flex items-center justify-between gap-4">

                    {/* LEFT: Logo + Branding */}
                    <Link href="/admin-panel" className="group flex items-center gap-3 z-[201] flex-shrink-0">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-4"
                        >
                            { }
                            <div className="rounded-full border-2 border-sky-500/70 p-[4px] shadow-[0_0_8px_rgba(14,165,233,0.4)] flex items-center justify-center">
                                <Image
                                    src="/assets/images/logo.png"
                                    alt="StayCool Logo"
                                    width={32}
                                    height={32}
                                    className="h-7 sm:h-8 w-auto object-contain"
                                />
                            </div>
                            { }
                            <Image
                                src="/assets/Picsart_26-03-22_23-32-24-684.png"
                                alt="StayCool"
                                width={120}
                                height={32}
                                className="h-6 sm:h-8 w-auto object-contain"
                            />
                        </motion.div>
                    </Link>

                    {/* CENTER: Desktop Nav Links */}
                    <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-1 justify-center">
                        {adminNavLinks.map((link, i) => {
                            const active = link.path === '/'
                                ? pathname === '/'
                                : link.path === '/admin-panel'
                                    ? pathname === '/admin-panel'
                                    : pathname.startsWith(link.path);
                            return (
                                <Link key={link.path} href={link.path} className="relative group py-2 px-3">
                                    <motion.span
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                        className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 whitespace-nowrap ${active ? 'text-[#0ea5e9]' : 'text-white/40 group-hover:text-white'
                                            }`}
                                    >
                                        {link.name}
                                    </motion.span>

                                    {/* Liquid underline */}
                                    <motion.div
                                        className="absolute -bottom-0.5 left-3 right-3 h-[2px] bg-[#0ea5e9]"
                                        initial={{ scaleX: 0 }}
                                        whileHover={{ scaleX: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                        style={{ transformOrigin: 'left' }}
                                    />

                                    {active && (
                                        <motion.div
                                            layoutId="admin-active-pill"
                                            className="absolute -bottom-0.5 left-3 right-3 h-[2px] bg-[#0ea5e9] shadow-[0_0_10px_#0ea5e9]"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* RIGHT: Admin info + Sign Out (desktop) / Hamburger (mobile) */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Desktop: Admin badge + Sign Out */}
                        <div className="hidden lg:flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{adminName}</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="relative group px-6 py-2 overflow-hidden border border-[#0ea5e9]/30 hover:border-[#0ea5e9] transition-colors"
                            >
                                <span className="relative z-10 text-[9px] font-black uppercase tracking-widest text-[#0ea5e9] group-hover:text-black transition-colors duration-500">
                                    Sign Out
                                </span>
                                <motion.div className="absolute inset-0 bg-[#0ea5e9] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            </button>
                        </div>

                        {/* Mobile: Hamburger */}
                        <button
                            onClick={onMenuToggle}
                            className="lg:hidden p-2 text-white hover:text-[#0ea5e9] transition-colors"
                            aria-label="Toggle navigation"
                        >
                            <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={28} />
                        </button>
                    </div>
                </div>
            </motion.header>
        </>
    );
};

export default AdminHeader;
