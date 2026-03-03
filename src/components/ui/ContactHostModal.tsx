'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Icon from '@/components/ui/AppIcon';

interface ContactHostModalProps {
    isOpen: boolean;
    onClose: () => void;
    hostId: string;
    hostName: string;
    propertyId: string;
}

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
            if (user) {
                setCurrentUser(user);
            }
            setIsLoading(false);
        };
        fetchUser();
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-zinc-950 w-full max-w-lg rounded-2xl shadow-xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-bold text-white">Chat with {hostName}</h2>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        aria-label="Close"
                    >
                        <Icon name="XMarkIcon" size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : currentUser ? (
                        <RealTimeChat
                            currentUser={{ id: currentUser.id, name: currentUser.user_metadata?.name }}
                            otherUser={{ id: hostId, name: hostName }}
                            propertyId={propertyId}
                        />
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-zinc-400 mb-4">Please log in to contact the host.</p>
                            <a href="/auth" className="inline-block px-6 py-2 bg-primary text-white rounded-xl font-bold">Log In</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactHostModal;
