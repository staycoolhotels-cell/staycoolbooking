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
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Icon name="CalendarDaysIcon" size={24} className="text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{cancellationPolicy.title}</h3>
                        </div>
                        <div className="prose prose-invert max-w-none">
                            {cancellationPolicy.title === 'Tiered' ? (
                                <div className="space-y-4">
                                    <p className="text-text-secondary text-lg">Strict tiered cancellation policy applies:</p>
                                    <ul className="list-disc pl-5 space-y-2 text-text-secondary text-base">
                                        <li><strong className="text-foreground">More than 7 days before check-in:</strong> Full refund.</li>
                                        <li><strong className="text-foreground">5-7 days before check-in:</strong> 70% refund to guest.</li>
                                        <li><strong className="text-foreground">2-4 days before check-in:</strong> 40% refund to guest.</li>
                                        <li><strong className="text-foreground">Less than 2 days (or check-in day):</strong> No refund.</li>
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-text-secondary text-lg leading-relaxed whitespace-pre-wrap">
                                    {cancellationPolicy.description}
                                </p>
                            )}
                        </div>
                    </>
                );
            case 'rules':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Icon name="KeyIcon" size={24} className="text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{houseRules.title}</h3>
                        </div>
                        <ul className="space-y-4">
                            {houseRules.rules.map((rule, index) => (
                                <li key={index} className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg border border-border/50">
                                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                    <span className="text-foreground text-lg">{rule}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                );
            case 'safety':
                return (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Icon name="ShieldCheckIcon" size={24} className="text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">{safetyProperty.title}</h3>
                        </div>
                        <ul className="space-y-4">
                            {safetyProperty.items.map((item, index) => (
                                <li key={index} className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-border/50">
                                    <Icon name="CheckCircleIcon" size={20} className="text-green-500 flex-shrink-0" />
                                    <span className="text-foreground text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-card rounded-xl p-6 md:p-8 border border-border relative">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-8">Things to know</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cancellation Policy */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <Icon name="CalendarDaysIcon" size={24} className="text-foreground" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground mb-2">{cancellationPolicy.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-3">
                        {cancellationPolicy.description}
                    </p>
                    <button
                        onClick={() => setSelectedSection('cancellation')}
                        className="text-sm font-semibold text-foreground underline text-left hover:text-foreground/80 transition-colors w-fit"
                    >
                        {cancellationPolicy.linkText}
                    </button>
                </div>

                {/* House Rules */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <Icon name="KeyIcon" size={24} className="text-foreground" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground mb-2">{houseRules.title}</h3>
                    <ul className="text-sm text-text-secondary leading-relaxed mb-3 space-y-1 line-clamp-3">
                        {/* Only show first 3 rules in preview */}
                        {houseRules.rules.slice(0, 3).map((rule, index) => (
                            <li key={index}>{rule}</li>
                        ))}
                        {houseRules.rules.length > 3 && <li>...</li>}
                    </ul>
                    <button
                        onClick={() => setSelectedSection('rules')}
                        className="text-sm font-semibold text-foreground underline text-left hover:text-foreground/80 transition-colors w-fit"
                    >
                        {houseRules.linkText}
                    </button>
                </div>

                {/* Safety & Property */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <Icon name="ShieldCheckIcon" size={24} className="text-foreground" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground mb-2">{safetyProperty.title}</h3>
                    <ul className="text-sm text-text-secondary leading-relaxed mb-3 space-y-1 line-clamp-3">
                        {/* Only show first 3 items in preview */}
                        {safetyProperty.items.slice(0, 3).map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                        {safetyProperty.items.length > 3 && <li>...</li>}
                    </ul>
                    <button
                        onClick={() => setSelectedSection('safety')}
                        className="text-sm font-semibold text-foreground underline text-left hover:text-foreground/80 transition-colors w-fit"
                    >
                        {safetyProperty.linkText}
                    </button>
                </div>
            </div>

            {/* Modal */}
            {selectedSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={closeModal}
                    />

                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header with Close Button */}
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-full bg-secondary/80 hover:bg-secondary text-text-secondary hover:text-foreground transition-colors"
                                aria-label="Close modal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 18 18" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {renderModalContent()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThingsToKnowSection;
