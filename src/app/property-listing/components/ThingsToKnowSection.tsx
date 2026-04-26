'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface ThingsToKnowSectionProps {
    cancellationPolicy: {
        title: string;
        description: string;
        linkText: string;
    };
    houseRules: {
        title: string;
        rules: string[];
        linkText: string;
    };
    safetyProperty: {
        title: string;
        items: string[];
        linkText: string;
    };
}

const ThingsToKnowSection = ({ cancellationPolicy, houseRules, safetyProperty }: ThingsToKnowSectionProps) => {
    const [selectedSection, setSelectedSection] = React.useState<'cancellation' | 'rules' | 'safety' | null>(null);

    const closeModal = () => setSelectedSection(null);

    // Close on escape key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const renderModalContent = () => {
        switch (selectedSection) {
            case 'cancellation':
                return (
                    <div className="flex flex-col max-h-[60vh]">
                        <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Icon name="CalendarDaysIcon" size={24} className="text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{cancellationPolicy.title}</h3>
                        </div>
                        <div className="prose prose-invert max-w-none overflow-y-auto premium-scrollbar pr-2 pb-2">
                            {cancellationPolicy.description === 'Tiered' ? (
                                <div className="space-y-4">
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Standard Cancellation Policy:</p>
                                    <div className="grid gap-2">
                                        {[
                                            { period: '10+ Days Before', refund: '100% Refund', color: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-400/10' },
                                            { period: '5-10 Days Before', refund: '70% Refund', color: 'text-sky-400', bg: 'bg-sky-400/5', border: 'border-sky-400/10' },
                                            { period: '2-5 Days Before', refund: '50% Refund', color: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/10' },
                                            { period: '< 2 Days Before', refund: '30% Refund', color: 'text-rose-400', bg: 'bg-rose-400/5', border: 'border-rose-400/10' }
                                        ].map((item, i) => (
                                            <div key={i} className={`${item.bg} ${item.border} border px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors hover:bg-white/5`}>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-0.5">{item.period} check-in</span>
                                                    <span className={`text-sm font-bold ${item.color}`}>{item.refund}</span>
                                                </div>
                                                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center border ${item.border}`}>
                                                    <Icon name="CheckIcon" size={14} className={item.color} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon name="SparklesIcon" size={14} className="text-sky-400" />
                                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Special Protection</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            <li className="text-[11px] text-zinc-400 flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                                                <span><strong className="text-zinc-200">6-Hour Grace Period:</strong> 100% refund if cancelled within 6 hours of booking.</span>
                                            </li>
                                            <li className="text-[11px] text-zinc-400 flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                                                <span><strong className="text-zinc-200">Same Day Booking:</strong> 100% refund if booked and cancelled on the same day.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                            ) : (
                                <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                    {cancellationPolicy.description}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 'rules':
                return (
                    <div className="flex flex-col max-h-[60vh]">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                                <Icon name="KeyIcon" size={16} className="text-amber-400" />
                            </div>
                            <h3 className="text-base font-bold text-foreground">{houseRules.title}</h3>
                        </div>
                        <ul className="space-y-0.5 overflow-y-auto premium-scrollbar pr-2 pb-1">
                            {houseRules.rules.map((rule, index) => (
                                <li key={index} className="flex items-center gap-2 py-1 border-b border-border/10 last:border-0">
                                    <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                                    <span className="text-foreground text-xs">{rule}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            case 'safety':
                return (
                    <div className="flex flex-col max-h-[60vh]">
                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                                <Icon name="ShieldCheckIcon" size={16} className="text-green-400" />
                            </div>
                            <h3 className="text-base font-bold text-foreground">{safetyProperty.title}</h3>
                        </div>
                        <ul className="space-y-0.5 overflow-y-auto premium-scrollbar pr-2 pb-1">
                            {safetyProperty.items.map((item, index) => (
                                <li key={index} className="flex items-center gap-2 py-1 border-b border-border/10 last:border-0">
                                    <Icon name="CheckCircleIcon" size={12} className="text-green-400 flex-shrink-0" />
                                    <span className="text-foreground text-xs">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 md:p-8 relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-4 md:mb-8">
                Things to know
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8">
                {/* Cancellation Policy */}
                <div className="group flex flex-col items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer h-full" onClick={() => setSelectedSection('cancellation')}>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="CalendarDaysIcon" size={18} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="text-sm md:text-base font-semibold text-white">{cancellationPolicy.title}</h3>
                            <Icon name="ChevronRightIcon" size={16} className="text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed mb-3">
                            {cancellationPolicy.description}
                        </p>
                        <span className="text-xs font-semibold text-blue-400 inline-block group-hover:underline mt-auto">
                            {cancellationPolicy.linkText}
                        </span>
                    </div>
                </div>

                {/* House Rules */}
                <div className="group flex flex-col items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer h-full" onClick={() => setSelectedSection('rules')}>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="KeyIcon" size={18} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="text-sm md:text-base font-semibold text-white">{houseRules.title}</h3>
                            <Icon name="ChevronRightIcon" size={16} className="text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                        <ul className="space-y-1 mb-3">
                            {houseRules.rules.slice(0, 3).map((rule, index) => (
                                <li key={index} className="flex items-center gap-2 text-xs md:text-sm text-zinc-400">
                                    <span className="w-1 h-1 rounded-full bg-amber-500/60 flex-shrink-0" />
                                    <span className="leading-snug">{rule}</span>
                                </li>
                            ))}
                            {houseRules.rules.length > 3 && (
                                <li className="text-xs text-zinc-500 pt-1">+{houseRules.rules.length - 3} more rules</li>
                            )}
                        </ul>
                        <span className="text-xs font-semibold text-amber-400 inline-block group-hover:underline mt-auto">
                            {houseRules.linkText}
                        </span>
                    </div>
                </div>

                {/* Safety & Property */}
                <div className="group flex flex-col items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer h-full" onClick={() => setSelectedSection('safety')}>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="ShieldCheckIcon" size={18} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="text-sm md:text-base font-semibold text-white">{safetyProperty.title}</h3>
                            <Icon name="ChevronRightIcon" size={16} className="text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                        <ul className="space-y-1 mb-3">
                            {safetyProperty.items.slice(0, 3).map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-xs md:text-sm text-zinc-400">
                                    <Icon name="CheckCircleIcon" size={12} className="text-green-500/70 flex-shrink-0" />
                                    <span className="leading-snug">{item}</span>
                                </li>
                            ))}
                            {safetyProperty.items.length > 3 && (
                                <li className="text-xs text-zinc-500 pt-1">+{safetyProperty.items.length - 3} more items</li>
                            )}
                        </ul>
                        <span className="text-xs font-semibold text-green-400 inline-block group-hover:underline mt-auto">
                            {safetyProperty.linkText}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl shadow-black overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header with Close Button */}
                        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-zinc-700 hover:scale-105 text-white transition-all shadow-lg"
                                aria-label="Close modal"
                            >
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content Container */}
                        <div className="p-4 md:p-5">
                            {renderModalContent()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThingsToKnowSection;
