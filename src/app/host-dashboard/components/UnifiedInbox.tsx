import React, { useState, useEffect } from 'react';
import { Message, SentimentLabel, QuickReply } from '../types';
import { Mail, Send, Sparkles, Languages, Lightbulb } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import RealTimeChat from '@/components/chat/RealTimeChat';

// Dummy quick replies kept for demo purposes
const dummyQuickReplies: QuickReply[] = [
  {
    id: 'qr1',
    text: 'Thank you for your feedback! We are glad you enjoyed your stay.',
    usageCount: 15,
  },
  {
    id: 'qr2',
    text: 'We are sorry to hear that. Our maintenance team is on the way.',
    usageCount: 8,
  },
  { id: 'qr3', text: 'Check-in is at 3 PM. Parking is available on-site.', usageCount: 20 },
  { id: 'qr4', text: 'Please find the WiFi details in the welcome guide.', usageCount: 12 },
];

const getSentimentColor = (sentiment: SentimentLabel): string => {
  switch (sentiment) {
    case 'Urgent':
      return 'bg-red-500';
    case 'Happy':
      return 'bg-green-500';
    case 'Frustrated':
      return 'bg-yellow-500';
    case 'Neutral':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

const UnifiedInbox: React.FC = () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

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
        sender:users!messages_sender_id_fkey(name),
        property:properties!messages_property_id_fkey(*)
      `)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (!error && messagesData) {
      const formattedMessages = messagesData.map((msg: any) => ({
        ...msg,
        sender_name: msg.sender?.name || 'Unknown Sender',
        property_name: msg.property?.title || 'Unknown Property'
      }));
      setMessages(formattedMessages);
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
        async (payload: any) => {
          // Re-fetch everything simply to grab relationships cleanly
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
    setReplyText('');

    if (!message.is_read) {
      // Optimistic UI update
      setMessages(messages.map((msg) => (msg.id === message.id ? { ...msg, is_read: true } : msg)));

      // DB Update
      await supabase.from('messages').update({ is_read: true }).eq('id', message.id);
    }
  };

  const handleSendReply = async () => {
    if (selectedMessage && replyText.trim() !== '' && currentUser) {
      console.log(`Replying to ${selectedMessage.sender_name}: ${replyText}`);

      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedMessage.sender_id, // Reply goes to original sender
        property_id: selectedMessage.property_id,
        content: replyText,
        sentiment: 'Neutral', // Real AI would process this ideally
        is_read: false
      });

      if (!error) {
        setReplyText('');
        setSelectedMessage(null);
      } else {
        alert("Failed to send reply");
      }
    }
  };

  const handleApplyQuickReply = (quickReply: QuickReply) => {
    setReplyText(quickReply.text);
  };

  const handleTranslate = (message: Message) => {
    console.log(`Translating message: "${message.content}"`);
    alert(`Translation for "${message.content}" (simulated): "Translated message text here."`);
  };

  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">Unified Inbox with Sentiment AI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1 bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">
            Inbox ({messages.filter((msg) => !msg.is_read).length} Unread)
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? <p className="text-white/50 text-sm">No messages yet.</p> : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg cursor-pointer ${selectedMessage?.id === message.id ? 'bg-sky-500/10 border-sky-400' : 'bg-white/5 hover:bg-white/10'} ${message.is_read ? 'opacity-70' : 'font-semibold'}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white">{message.sender_name}</span>
                  <span className="text-xs text-white/50">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 truncate">{message.content}</p>
                <div className="flex items-center mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs text-white ${getSentimentColor(message.sentiment)}`}
                  >
                    <Sparkles size={12} className="inline-block mr-1" />
                    {message.sentiment}
                  </span>
                  {message.property_name && (
                    <span className="ml-2 text-xs text-white/50 truncate max-w-[120px]">({message.property_name})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail & Reply */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl flex flex-col h-[600px] overflow-hidden">
          {selectedMessage && currentUser ? (
            <RealTimeChat
              currentUser={{ id: currentUser.id }}
              otherUser={{ id: selectedMessage.sender_id, name: selectedMessage.sender_name || 'Guest' }}
              propertyId={selectedMessage.property_id}
              contextTitle={selectedMessage.property_name}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-white/40">
                <Mail size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a message to view details and reply.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedInbox;
