'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { supabase } from '@/lib/supabaseClient';
import { signOutUser } from '@/lib/auth-actions';
import { useRouter } from 'next/navigation';

const adminNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/admin-panel' },
    { name: 'Properties', path: '/admin-panel/property-management' },
    { name: 'Financials', path: '/admin-panel/financials' },
    { name: 'Users', path: '/admin-panel/user-management' },
    { name: 'Marketing', path: '/admin-panel/marketing' },
    { name: 'Reviews', path: '/admin-panel/reviews' },
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
                            className="relative w-9 h-9 rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.15)] bg-white p-[1px] border border-zinc-200/30"
                        >
                            <img src="/assets/images/logo.png.jpg" alt="StayCool Logo" className="w-full h-full object-cover rounded-full" />
                        </motion.div>
                        <div className="overflow-hidden hidden sm:block">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="relative w-[110px] h-[24px] -mb-1"
                            >
                                <AppImage
                                    src="/assets/Picsart_26-03-22_23-32-24-684.png"
                                    alt="StayCool"
                                    fill
                                    objectFit="contain"
                                    style={{ objectPosition: 'left' }}
                                />
                            </motion.div>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                Admin Panel
                            </span>
                        </div>
                        <span className="sm:hidden text-[13px] font-black uppercase tracking-tighter text-white">
                            Admin
                        </span>

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

            {/* Mobile Full-Screen Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="fixed inset-0 top-[64px] z-[190] bg-[#050505]/97 backdrop-blur-2xl lg:hidden flex flex-col items-center justify-start pt-12 pb-20 overflow-y-auto"
                    >
                        {/* Background glow */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-sky-500/8 rounded-full blur-[120px]" />
                            <div className="absolute bottom-[-5%] left-[-10%] w-[300px] h-[300px] bg-sky-500/5 rounded-full blur-[100px]" />
                        </div>

                        <nav className="flex flex-col items-center gap-4 z-10 w-full px-8">
                            {adminNavLinks.map((link, i) => {
                                const active = link.path === '/'
                                    ? pathname === '/'
                                    : link.path === '/admin-panel'
                                        ? pathname === '/admin-panel'
                                        : pathname.startsWith(link.path);
                                return (
                                    <motion.div
                                        key={link.path}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.06 + i * 0.06, type: 'spring', stiffness: 100 }}
                                        className="w-full text-center"
                                    >
                                        <Link
                                            href={link.path}
                                            onClick={onMenuToggle}
                                            className={`block text-2xl font-bold uppercase tracking-[0.2em] transition-all duration-300 py-3 ${active ? 'text-[#0ea5e9]' : 'text-white hover:text-sky-400'
                                                }`}
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                );
                            })}

                            {/* Sign Out button in mobile menu */}
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
                                className="mt-8 w-full max-w-[260px]"
                            >
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-10 py-4 border border-sky-500/30 bg-sky-500/10 text-sky-400 font-black uppercase tracking-[0.2em] hover:bg-sky-500 hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(14,165,233,0.15)] rounded-xl"
                                >
                                    Sign Out
                                </button>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminHeader;
