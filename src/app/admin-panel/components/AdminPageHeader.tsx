'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface AdminPageHeaderProps {
    title: string;
    subtitle: string;
    action?: {
        label: string;
        onClick: () => void;
        icon: string;
    };
    children?: React.ReactNode;
}

const AdminPageHeader = ({ title, subtitle, action, children }: AdminPageHeaderProps) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-2 leading-tight">
                    {title.split(' ')[0]} <span className="text-primary italic">{title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium tracking-wide">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
                {action && (
                    <button
                        onClick={action.onClick}
                        className="flex-1 md:flex-none px-6 py-3 bg-white text-black rounded-xl font-heading font-bold hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        <Icon name={action.icon as any} size={18} />
                        <span>{action.label}</span>
                    </button>
                )}
                {children}
            </div>
        </div>
    );
};

export default AdminPageHeader;
