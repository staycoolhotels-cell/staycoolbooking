'use client';

import React, { useState, useEffect } from 'react';
import { Message, SentimentLabel, QuickReply } from '../types';
import { createBrowserClient } from '@supabase/ssr';
import RealTimeChat from '@/components/chat/RealTimeChat';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import GuestDetailsModal from './GuestDetailsModal';

const getSentimentColor = (sentiment: SentimentLabel): { bg: string, text: string, border: string, icon: string } => {
  switch (sentiment) {
    case 'Urgent':
      return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', icon: 'ExclamationCircleIcon' };
    case 'Happy':
      return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: 'FaceSmileIcon' };
    case 'Frustrated':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', icon: 'FaceFrownIcon' };
    case 'Neutral':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: 'ChatBubbleLeftIcon' };
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20', icon: 'ChatBubbleOvalLeftIcon' };
  }
};

const UnifiedInbox: React.FC = () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isGuestDetailsOpen, setIsGuestDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id });
        fetchMessages(user.id);
      }
    };

    fetchSession();
  }, [supabase.auth]);

  const fetchMessages = async (userId: string) => {
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(name, avatar_url),
        property:properties!messages_property_id_fkey(title)
      `)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (!error && messagesData) {
      // Group by sender + property block to create "threads" logic
      // For simplicity in this UI, we just map them as individual actionable threads
      const formattedMessages = messagesData.map((msg: any) => ({
        ...msg,
        sender_name: msg.sender?.name || 'Guest User',
        sender_avatar: msg.sender?.avatar_url || null,
        property_name: msg.property?.title || 'General Inquiry'
      }));

      // Basic grouping by sender to show latest message per guest
      const uniqueSenders = new Map();
      formattedMessages.forEach((msg: any) => {
        if (!uniqueSenders.has(msg.sender_id)) {
          uniqueSenders.set(msg.sender_id, msg);
        }
      });

      setMessages(Array.from(uniqueSenders.values()));
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        async () => {
          fetchMessages(currentUser.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase]);

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);

    if (!message.is_read) {
      setMessages(messages.map((msg) => (msg.id === message.id ? { ...msg, is_read: true } : msg)));
      await supabase.from('messages').update({ is_read: true }).eq('id', message.id);
    }
  };

  const unreadCount = messages.filter((msg) => !msg.is_read).length;

  return (
    <div className="w-full space-y-4 md:space-y-8 h-auto lg:h-[calc(100vh-140px)] lg:min-h-[700px] flex flex-col">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#0a0a0f]/80 p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex-none">
        <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Icon name="ChatBubbleLeftRightIcon" size={32} className="text-indigo-400 drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg">Unified Inbox</h1>
            <p className="text-sm font-medium text-zinc-400 mt-1 uppercase tracking-widest flex items-center gap-2">
              <Icon name="SparklesIcon" size={14} className="text-indigo-400" />
              Sentiment AI Enabled
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            {unreadCount > 0 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            )}
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Unread Contexts</p>
            <p className={`text-3xl font-heading font-black drop-shadow-sm ${unreadCount > 0 ? 'text-white' : 'text-zinc-600'}`}>{unreadCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 lg:overflow-hidden">
        {/* 2. Thread List Sidebar */}
        <div className="w-full lg:w-[400px] xl:w-[450px] bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col relative overflow-hidden flex-none h-[400px] lg:h-full">
          <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-inner">
                <Icon name="InboxStackIcon" size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Active Threads
              </h2>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Icon name="FunnelIcon" size={14} className="text-zinc-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto w-full p-4 space-y-2 no-scrollbar relative z-10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <Icon name="InboxIcon" size={48} className="text-zinc-500 mb-4" />
                <p className="text-sm font-bold text-zinc-300">Inbox Zero</p>
                <p className="text-xs text-zinc-500 mt-1">You are all caught up!</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, idx) => {
                  const isSelected = selectedMessage?.id === message.id;
                  const sentiment = getSentimentColor(message.sentiment);

                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border group flex gap-4 items-start
                        ${isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}
                      `}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center flex-none overflow-hidden shadow-inner">
                          {message.sender_avatar ? (
                            <img src={message.sender_avatar} alt={message.sender_name} className="w-full h-full object-cover" />
                          ) : (
                            <Icon name="UserIcon" size={20} className="text-zinc-500" />
                          )}
                        </div>
                        {!message.is_read && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-[#0a0a0f] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className={`font-bold text-sm truncate pr-2 transition-colors ${isSelected ? 'text-indigo-100' : (message.is_read ? 'text-zinc-300' : 'text-white')}`}>
                            {message.sender_name}
                          </h3>
                          <span className="text-[10px] font-bold text-zinc-500 whitespace-nowrap">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className={`text-xs truncate mb-2 ${isSelected ? 'text-indigo-200/70' : (message.is_read ? 'text-zinc-500' : 'text-zinc-300 font-medium')}`}>
                          {message.content}
                        </p>

                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase truncate max-w-[120px]">
                            {message.property_name}
                          </p>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${sentiment.bg} ${sentiment.border}`}>
                            <Icon name={sentiment.icon as any} size={10} className={sentiment.text} />
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${sentiment.text}`}>
                              {message.sentiment}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* 3. Realtime Chat Component / Empty State */}
        <div className="flex-1 bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group h-[600px] lg:h-full flex flex-col">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>

          {selectedMessage && currentUser ? (
            <div className="h-full relative z-10 flex flex-col bg-black/20">
              {/* Context Header for the Chat */}
              <div className="p-4 md:p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0a0f]/80 backdrop-blur-md">
                <div className="flex items-center gap-3 md:gap-4 w-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                    {selectedMessage.sender_avatar ? (
                      <img src={selectedMessage.sender_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="UserIcon" size={20} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm md:text-base font-bold text-white truncate">{selectedMessage.sender_name}</h2>
                    <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 truncate">
                      Interested in: <span className="text-indigo-400">{selectedMessage.property_name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button 
                    onClick={() => setIsGuestDetailsOpen(true)}
                    className="flex-1 sm:flex-none px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="DocumentTextIcon" size={14} /> Details
                  </button>
                  <button className="flex-1 sm:flex-none px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center gap-2">
                    <Icon name="CheckCircleIcon" size={14} /> Resolve
                  </button>
                </div>
              </div>

              {/* Embed the standard chat component but styled naturally by its own bounds */}
              <div className="flex-1 overflow-hidden">
                <RealTimeChat
                  currentUser={{ id: currentUser.id }}
                  otherUser={{ id: selectedMessage.sender_id, name: selectedMessage.sender_name || 'Guest' }}
                  propertyId={selectedMessage.property_id}
                  contextTitle={selectedMessage.property_name}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center relative z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-1000" />
              <div className="text-center relative z-10 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-sm max-w-sm">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Icon name="ChatBubbleLeftEllipsisIcon" size={40} className="text-indigo-400 opacity-80" />
                </div>
                <h3 className="text-xl font-heading font-bold text-white mb-2">Select a Conversation</h3>
                <p className="text-sm text-zinc-500 font-medium">
                  Choose a thread from the left to view message history, property context, and reply in real-time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedMessage && (
        <GuestDetailsModal
          userId={selectedMessage.sender_id}
          isOpen={isGuestDetailsOpen}
          onClose={() => setIsGuestDetailsOpen(false)}
        />
      )}
    </div>
  );
};

export default UnifiedInbox;
