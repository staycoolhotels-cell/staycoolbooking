'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { MessageCircle, Send, ChevronLeft, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Thread {
    otherUserId: string;
    otherUserName: string;
    lastMessage: string;
    lastTime: string;
    unread: number;
    propertyName?: string;
}

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    is_read: boolean;
}

const GuestInbox: React.FC<{ guestId: string }> = ({ guestId }) => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [threads, setThreads] = useState<Thread[]>([]);
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMsg, setNewMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch all threads (conversations)
    const fetchThreads = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:users!messages_sender_id_fkey(id, name), receiver:users!messages_receiver_id_fkey(id, name), property:properties!messages_property_id_fkey(title)')
            .or(`sender_id.eq.${guestId},receiver_id.eq.${guestId}`)
            .order('created_at', { ascending: false });

        if (error || !data) { setLoading(false); return; }

        // Group into threads
        const threadMap = new Map<string, Thread>();
        data.forEach((msg: any) => {
            const isFromMe = msg.sender_id === guestId;
            const otherUser = isFromMe ? msg.receiver : msg.sender;
            if (!otherUser) return;
            const key = otherUser.id;
            if (!threadMap.has(key)) {
                threadMap.set(key, {
                    otherUserId: otherUser.id,
                    otherUserName: otherUser.name || 'Host',
                    lastMessage: msg.content,
                    lastTime: msg.created_at,
                    unread: (!isFromMe && !msg.is_read) ? 1 : 0,
                    propertyName: msg.property?.title,
                });
            } else {
                const t = threadMap.get(key)!;
                if (!isFromMe && !msg.is_read) t.unread += 1;
            }
        });

        setThreads(Array.from(threadMap.values()));
        setLoading(false);
    };

    // Fetch messages for selected thread
    const fetchMessages = async (otherUserId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('id, content, sender_id, created_at, is_read')
            .or(
                `and(sender_id.eq.${guestId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${guestId})`
            )
            .order('created_at', { ascending: true });

        setMessages(data || []);

        // Mark unread messages as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', guestId)
            .eq('sender_id', otherUserId)
            .eq('is_read', false);

        // Update thread unread count locally
        setThreads(prev => prev.map(t => t.otherUserId === otherUserId ? { ...t, unread: 0 } : t));
    };

    useEffect(() => {
        fetchThreads();
    }, [guestId]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Real-time subscription for new messages
    useEffect(() => {
        const channel = supabase
            .channel(`guest-inbox-${guestId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${guestId}`,
            }, () => {
                fetchThreads();
                if (selectedThread) fetchMessages(selectedThread.otherUserId);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [guestId, selectedThread]);

    const handleSelectThread = (thread: Thread) => {
        setSelectedThread(thread);
        fetchMessages(thread.otherUserId);
    };

    const handleSend = async () => {
        if (!newMsg.trim() || !selectedThread || sending) return;
        setSending(true);
        const { error } = await supabase.from('messages').insert({
            sender_id: guestId,
            receiver_id: selectedThread.otherUserId,
            content: newMsg.trim(),
            is_read: false,
        });
        if (!error) {
            setNewMsg('');
            fetchMessages(selectedThread.otherUserId);
        }
        setSending(false);
    };

    const totalUnread = threads.reduce((acc, t) => acc + t.unread, 0);

    return (
        <section>
            <div className="flex items-center gap-3 mb-6">
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">Messages</h3>
                {totalUnread > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {totalUnread} new
                    </span>
                )}
                <div className="h-[1px] flex-grow bg-gradient-to-r from-zinc-800 to-transparent" />
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 rounded-[2rem] overflow-hidden">
                <AnimatePresence mode="wait">
                    {!selectedThread ? (
                        /* Thread List */
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            {loading ? (
                                <div className="p-8 text-center text-zinc-600 text-sm">Loading messages...</div>
                            ) : threads.length === 0 ? (
                                <div className="p-10 flex flex-col items-center justify-center gap-3 text-center">
                                    <MessageCircle size={36} className="text-zinc-700" />
                                    <p className="text-zinc-600 text-sm">No messages yet.</p>
                                    <p className="text-zinc-700 text-xs">When a host replies, you'll see it here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-900">
                                    {threads.map(thread => (
                                        <button
                                            key={thread.otherUserId}
                                            onClick={() => handleSelectThread(thread)}
                                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-zinc-900/50 transition-colors text-left group"
                                        >
                                            {/* Avatar */}
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                                                    <span className="text-sky-400 font-bold text-sm">
                                                        {thread.otherUserName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                {thread.unread > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                                                        {thread.unread}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-bold ${thread.unread > 0 ? 'text-white' : 'text-zinc-300'}`}>
                                                        {thread.otherUserName}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                                                        {new Date(thread.lastTime).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {thread.propertyName && (
                                                    <p className="text-[10px] text-sky-500/70 truncate">re: {thread.propertyName}</p>
                                                )}
                                                <p className={`text-xs truncate mt-0.5 ${thread.unread > 0 ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                    {thread.lastMessage}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* Conversation View */
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex flex-col h-[450px]"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-900 bg-zinc-950/50 shrink-0">
                                <button
                                    onClick={() => setSelectedThread(null)}
                                    className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                                    <span className="text-sky-400 font-bold text-xs">
                                        {selectedThread.otherUserName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{selectedThread.otherUserName}</p>
                                    {selectedThread.propertyName && (
                                        <p className="text-[10px] text-zinc-500 truncate">re: {selectedThread.propertyName}</p>
                                    )}
                                </div>
                                <div className="ml-auto flex items-center gap-1.5 text-emerald-500">
                                    <Wifi size={12} className="animate-pulse" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">Live</span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                                {messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-zinc-700 text-sm italic">
                                        No messages in this conversation.
                                    </div>
                                ) : (
                                    messages.map(msg => {
                                        const isMe = msg.sender_id === guestId;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                                        ? 'bg-sky-600 text-white rounded-br-sm'
                                                        : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                                                    }`}>
                                                    {msg.content}
                                                    <p className={`text-[9px] mt-1 ${isMe ? 'text-sky-200/70' : 'text-zinc-600'} text-right`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="shrink-0 px-4 py-3 border-t border-zinc-900 bg-zinc-950/50 flex gap-2">
                                <input
                                    type="text"
                                    value={newMsg}
                                    onChange={e => setNewMsg(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder={`Reply to ${selectedThread.otherUserName}...`}
                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!newMsg.trim() || sending}
                                    className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg shadow-sky-900/30"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default GuestInbox;
