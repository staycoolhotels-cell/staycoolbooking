'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Icon from '@/components/ui/AppIcon';
import { Send } from 'lucide-react';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    sentiment: string;
    is_read: boolean;
}

interface RealTimeChatProps {
    currentUser: { id: string; name?: string };
    otherUser: { id: string; name?: string };
    propertyId?: string;
    contextTitle?: string;
    containerHeight?: string;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({
    currentUser,
    otherUser,
    propertyId,
    containerHeight,
}) => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: true });

        if (!error) {
            setMessages(data || []);
            const unreadIds = data?.filter(m => m.receiver_id === currentUser.id && !m.is_read).map(m => m.id) || [];
            if (unreadIds.length > 0) {
                await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMessages();
        const channel = supabase
            .channel(`chat-${currentUser.id}-${otherUser.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${currentUser.id}`,
            }, (payload) => {
                const msg = payload.new as Message;
                if (msg.sender_id === otherUser.id) {
                    setMessages(prev => [...prev, msg]);
                    supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then();
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser.id, otherUser.id]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const content = newMessage.trim();
        setNewMessage('');
        const { data, error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            receiver_id: otherUser.id,
            property_id: propertyId,
            content,
            sentiment: 'Neutral',
            is_read: false,
        }).select().single();
        if (!error && data) setMessages(prev => [...prev, data as Message]);
    };

    const formatTime = (ts: string) =>
        new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const grouped = messages.reduce((acc, msg) => {
        const d = new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        (acc[d] = acc[d] || []).push(msg);
        return acc;
    }, {} as Record<string, Message[]>);

    return (
        /* absolute positioning: messages take all space above input */
        <div className="relative w-full" style={{ height: containerHeight || '100%' }}>
            {/* Messages — fills top, leaves 60px for input */}
            <div
                className="absolute inset-0 bottom-[60px] overflow-y-auto px-4 py-3"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                            <Icon name="ChatBubbleLeftRightIcon" size={26} className="text-white/20" />
                        </div>
                        <p className="text-sm text-zinc-500 text-center">No messages yet.<br />Say hi to {otherUser.name}!</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 my-3">
                                <div className="h-px flex-1 bg-white/[0.06]" />
                                <span className="text-[10px] text-zinc-600 font-medium">{date}</span>
                                <div className="h-px flex-1 bg-white/[0.06]" />
                            </div>
                            {msgs.map((msg, i) => {
                                const isMe = msg.sender_id === currentUser.id;
                                const stacked = i > 0 && msgs[i - 1].sender_id === msg.sender_id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${stacked ? 'mt-0.5' : 'mt-3'}`}>
                                        <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                isMe
                                                    ? 'bg-primary text-white rounded-tr-sm'
                                                    : 'bg-white/[0.08] border border-white/[0.07] text-zinc-200 rounded-tl-sm'
                                            }`}>
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            </div>
                                            <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-[10px] text-zinc-600">{formatTime(msg.created_at)}</span>
                                                {isMe && (
                                                    <Icon name="CheckIcon" size={11} className={msg.is_read ? 'text-primary/70' : 'text-zinc-600'} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar — pinned to bottom */}
            <form
                onSubmit={handleSend}
                className="absolute bottom-0 left-0 right-0 h-[60px] flex items-center gap-2 px-3 border-t border-white/[0.07] bg-zinc-950"
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Message ${otherUser.name || 'host'}...`}
                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-primary/40 transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-9 h-9 flex-shrink-0 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/80 disabled:opacity-30 transition-all active:scale-95"
                >
                    <Send size={15} className="text-white" />
                </button>
            </form>
        </div>
    );
};

export default RealTimeChat;
