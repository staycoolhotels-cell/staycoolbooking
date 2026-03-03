'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Icon from '@/components/ui/AppIcon';
import { Send, Sparkles } from 'lucide-react';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    sentiment: string;
    is_read: boolean;
    sender_name?: string;
}

interface RealTimeChatProps {
    currentUser: { id: string; name?: string };
    otherUser: { id: string; name?: string };
    propertyId?: string;
    contextTitle?: string;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({ currentUser, otherUser, propertyId, contextTitle }) => {
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
        // Fetch messages where (sender=me AND receiver=them) OR (sender=them AND receiver=me)
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
        } else {
            setMessages(data || []);
            // Mark received messages as read
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
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    const msg = payload.new as Message;
                    if (msg.sender_id === otherUser.id) {
                        setMessages((prev) => [...prev, msg]);
                        // Mark as read
                        supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id, otherUser.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgContent = newMessage.trim();
        setNewMessage('');

        const { data, error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            receiver_id: otherUser.id,
            property_id: propertyId,
            content: msgContent,
            sentiment: 'Neutral',
            is_read: false
        }).select().single();

        if (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } else if (data) {
            setMessages((prev) => [...prev, data as Message]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 rounded-2xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold">{otherUser.name || 'User'}</h3>
                    {contextTitle && <p className="text-xs text-zinc-500">{contextTitle}</p>}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <Icon name="ChatBubbleLeftRightIcon" size={48} className="opacity-20 mb-2" />
                        <p className="text-sm">No messages yet. Say hi!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender_id === currentUser.id
                                    ? 'bg-sky-600 text-white rounded-tr-none'
                                    : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <div className="flex items-center justify-end mt-1 space-x-2">
                                    <span className="text-[10px] opacity-50">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.sender_id === currentUser.id && (
                                        <Icon
                                            name="CheckIcon"
                                            size={12}
                                            className={msg.is_read ? 'text-sky-300' : 'text-zinc-500'}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-500 disabled:opacity-50 transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default RealTimeChat;
