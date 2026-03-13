'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Icon from '@/components/ui/AppIcon';
import RealTimeChat from '@/components/chat/RealTimeChat';

interface ContactHostModalProps {
    isOpen: boolean;
    onClose: () => void;
    hostId: string;
    hostName: string;
    propertyId: string;
}

const ContactHostModal: React.FC<ContactHostModalProps> = ({ isOpen, onClose, hostId, hostName, propertyId }) => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUser(user);
            setIsLoading(false);
        };
        fetchUser();
    }, []);

    if (!isOpen) return null;



    return (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end sm:justify-center sm:items-center bg-black/70 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose} />

            <div
                className="relative z-10 w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ height: '80vh' }}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                    >
                        <Icon name="ArrowLeftIcon" size={18} />
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">
                            {hostName ? hostName[0].toUpperCase() : 'H'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-bold text-white truncate">{hostName}</h2>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                            Usually responds within 1 hour
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                    >
                        <Icon name="XMarkIcon" size={16} />
                    </button>
                </div>

                {/* Chat — fills all remaining space below header */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary" />
                        </div>
                    ) : currentUser ? (
                        <RealTimeChat
                            currentUser={{ id: currentUser.id, name: currentUser.user_metadata?.name }}
                            otherUser={{ id: hostId, name: hostName }}
                            propertyId={propertyId}
                            containerHeight="100%"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                            <Icon name="LockClosedIcon" size={28} className="text-zinc-600" />
                            <p className="text-sm text-zinc-400">Please log in to contact the host.</p>
                            <a href="/auth" className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm">
                                Log In
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactHostModal;
