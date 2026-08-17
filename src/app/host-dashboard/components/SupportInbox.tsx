'use client';

import React, { useState, useEffect } from 'react';
import { getUserMessages, getAdminUser } from '@/lib/chat-actions';
import { Message } from '../types';
import { createBrowserClient } from '@supabase/ssr';
import RealTimeChat from '@/components/chat/RealTimeChat';
import Icon from '@/components/ui/AppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SupportInboxProps {
  currentUser: { id: string; name: string };
}

const SupportInbox: React.FC<SupportInboxProps> = ({ currentUser }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  const fetchMessages = async (userId: string) => {
    setIsLoading(true);
    const messagesData = await getUserMessages(userId);
    const admin = await getAdminUser();
    if (admin) {
      setAdminUser(admin);
    }

    if (messagesData) {
      const formattedMessages = messagesData.map((msg: any) => ({
        ...msg,
        sender_name: msg.sender?.name || 'Admin',
        sender_avatar: msg.sender?.avatar_url || null,
        property_name: 'Platform Support'
      }));

      // Basic grouping by sender to show latest message per other user
      const uniqueThreads = new Map();
      formattedMessages.forEach((msg: any) => {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;

        // ONLY show admin conversations in Support Inbox
        if (otherUser?.role !== 'admin') {
          return;
        }

        const threadKey = otherUserId; // Support threads are usually user-to-user
        
        if (!uniqueThreads.has(threadKey)) {
          uniqueThreads.set(threadKey, {
            ...msg,
            sender_id: otherUserId,
            sender_name: otherUser?.name || 'Admin',
            sender_avatar: otherUser?.avatar_url || null
          });
        }
      });

      const threads = Array.from(uniqueThreads.values());
      setMessages(threads);
      
      // Auto-select the first thread if none selected
      if (threads.length > 0) {
        if (!selectedMessage) {
          setSelectedMessage(threads[0]);
        }
      } else if (admin && !selectedMessage) {
        // Auto select new chat thread with Admin if no support history exists
        const defaultAdminThread: Message = {
          id: `support-admin-${admin.id}`,
          sender_id: admin.id,
          receiver_id: userId,
          sender_name: admin.name || 'Platform Support Admin',
          sender_avatar: admin.avatar_url || null,
          content: 'Click to start chatting with admin support...',
          created_at: new Date().toISOString(),
          sentiment: 'Neutral',
          is_read: true,
        };
        setSelectedMessage(defaultAdminThread);
      }
    } else if (admin && !selectedMessage) {
      const defaultAdminThread: Message = {
        id: `support-admin-${admin.id}`,
        sender_id: admin.id,
        receiver_id: userId,
        sender_name: admin.name || 'Platform Support Admin',
        sender_avatar: admin.avatar_url || null,
        content: 'Click to start chatting with admin support...',
        created_at: new Date().toISOString(),
        sentiment: 'Neutral',
        is_read: true,
      };
      setSelectedMessage(defaultAdminThread);
    }
    setIsLoading(false);
  };

  const handleStartNewChat = async () => {
    let targetAdmin = adminUser;
    if (!targetAdmin) {
      targetAdmin = await getAdminUser();
      if (targetAdmin) {
        setAdminUser(targetAdmin);
      }
    }

    if (!targetAdmin) {
      toast.error('Admin support user not found. Please try again later.');
      return;
    }

    const newThread: Message = {
      id: `support-admin-${targetAdmin.id}`,
      sender_id: targetAdmin.id,
      receiver_id: currentUser.id,
      sender_name: targetAdmin.name || 'Platform Support Admin',
      sender_avatar: targetAdmin.avatar_url || null,
      content: 'Start chatting with admin support...',
      created_at: new Date().toISOString(),
      sentiment: 'Neutral',
      is_read: true,
    };

    setSelectedMessage(newThread);
    setViewMode('chat');
  };

  useEffect(() => {
    if (currentUser) {
      fetchMessages(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('support-messages-realtime')
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
    setViewMode('chat');

    if (!message.is_read) {
      setMessages(messages.map((msg) => (msg.id === message.id ? { ...msg, is_read: true } : msg)));
      await supabase.from('messages').update({ is_read: true }).eq('id', message.id);
    }
  };

  const unreadCount = messages.filter((msg) => !msg.is_read).length;

  return (
    <div className="w-full space-y-4 md:space-y-8 h-auto lg:h-[calc(100vh-140px)] lg:min-h-[700px] flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 bg-[#0a0a0f]/80 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex-none">
        <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 lg:gap-5 w-full lg:w-auto">
          <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] shrink-0">
            <Icon name="LifebuoyIcon" size={32} className="text-indigo-400 drop-shadow-md" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-4xl font-heading font-black text-white tracking-tight drop-shadow-lg truncate">Support Chat</h1>
            <p className="text-[9px] lg:text-sm font-bold text-zinc-400 mt-0.5 lg:mt-1 uppercase tracking-widest flex items-center gap-2 flex-wrap">
              <Icon name="ShieldCheckIcon" size={12} className="text-indigo-400" />
              Direct Admin Communication
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-3 lg:gap-4 w-full lg:w-auto mt-2 lg:mt-0 items-center">
          <button
            onClick={handleStartNewChat}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs lg:text-sm transition-all shadow-lg flex items-center gap-2"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={18} />
            <span>Contact Support</span>
          </button>

          <div className="flex-1 lg:flex-none bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-5 lg:px-8 py-3 lg:py-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden min-w-[140px]">
            <p className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 whitespace-nowrap">Status</p>
            <p className="text-xl lg:text-2xl font-heading font-black text-success">Online</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 lg:overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className={`
          ${viewMode === 'chat' ? 'hidden' : 'flex'} lg:flex
          w-full lg:w-[350px] bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl flex-col relative overflow-hidden flex-none h-[500px] lg:h-full transition-all duration-300
        `}>
          <div className="p-4 lg:p-6 border-b border-white/10 flex justify-between items-center relative z-10 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-inner">
                <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Support Threads
              </h2>
            </div>
            <button
              onClick={handleStartNewChat}
              className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-all"
              title="Start new chat with Admin"
            >
              <Icon name="PlusIcon" size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto w-full p-4 space-y-2 no-scrollbar relative z-10">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
               </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-90 px-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Icon name="InboxIcon" size={28} className="text-indigo-400" />
                </div>
                <p className="text-sm font-bold text-zinc-200">No Support History</p>
                <p className="text-xs text-zinc-400 mt-1 mb-6">Need help? Send a direct message to Platform Support.</p>
                <button
                  onClick={handleStartNewChat}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={16} />
                  <span>Start Chat with Admin</span>
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, idx) => {
                  const isSelected = selectedMessage?.sender_id === message.sender_id;

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
                          <h3 className={`font-bold text-sm truncate pr-2 transition-colors ${isSelected ? 'text-indigo-100' : 'text-white'}`}>
                            {message.sender_name}
                          </h3>
                        </div>

                        <p className={`text-xs truncate ${isSelected ? 'text-indigo-200/70' : 'text-zinc-500'}`}>
                          {message.content}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`
          ${viewMode === 'list' ? 'hidden' : 'flex'} lg:flex
          flex-1 bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative group h-[500px] lg:h-full flex-col transition-all duration-300
        `}>
          {selectedMessage ? (
            <div className="h-full relative z-10 flex flex-col bg-black/20">
              <div className="p-3 md:p-4 border-b border-white/10 flex justify-between items-center bg-[#0a0a0f]/80 backdrop-blur-md">
                <div className="flex items-center gap-3 md:gap-4">
                  <button
                    onClick={() => setViewMode('list')}
                    className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Icon name="ChevronLeftIcon" size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                    {selectedMessage.sender_avatar ? (
                      <img src={selectedMessage.sender_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="UserIcon" size={20} className="text-zinc-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-white">{selectedMessage.sender_name}</h2>
                    <p className="text-[9px] md:text-[10px] font-bold text-success uppercase tracking-widest">Active Now</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden relative">
                <RealTimeChat
                  currentUser={currentUser}
                  otherUser={{ id: selectedMessage.sender_id, name: selectedMessage.sender_name }}
                  contextTitle="StayCool Platform Support"
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center relative z-10">
              <div className="text-center p-8 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name="ChatBubbleLeftEllipsisIcon" size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Platform Support</h3>
                <p className="text-sm text-zinc-400 mb-6">Select a support thread or start a direct conversation with an admin.</p>
                <button
                  onClick={handleStartNewChat}
                  className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
                >
                  <Icon name="PaperAirplaneIcon" size={16} />
                  <span>Message Admin Support</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportInbox;

