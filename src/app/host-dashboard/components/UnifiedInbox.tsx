import React, { useState } from 'react';
import { Message, SentimentLabel, QuickReply } from '../types';
import { Mail, Send, Sparkles, Languages, Lightbulb } from 'lucide-react';

const dummyMessages: Message[] = [
  {
    id: 'msg1',
    sender: 'Alice Wonderland',
    timestamp: '2024-01-14T10:00:00Z',
    content: "Hi, I love the Luxury Villa! Just wondering if there's a gym nearby?",
    sentiment: 'Happy',
    isRead: false,
    propertyName: 'Luxury Villa Beachfront',
  },
  {
    id: 'msg2',
    sender: 'Bob The Builder',
    timestamp: '2024-01-14T09:30:00Z',
    content: 'The WiFi is not working. This is very frustrating.',
    sentiment: 'Frustrated',
    isRead: false,
    propertyName: 'Downtown Penthouse',
  },
  {
    id: 'msg3',
    sender: 'Charly Chaplin',
    timestamp: '2024-01-13T18:00:00Z',
    content: 'When is check-in for the Mountain Cabin? Also, is parking available?',
    sentiment: 'Urgent',
    isRead: true,
    propertyName: 'Mountain Cabin Retreat',
  },
  {
    id: 'msg4',
    sender: 'Guest from France',
    timestamp: '2024-01-13T15:00:00Z',
    content: "Bonjour, je voudrais savoir s'il y a une piscine chauffée.",
    sentiment: 'Neutral',
    isRead: true,
    propertyName: 'Luxury Villa Beachfront',
  },
];

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
  const [messages, setMessages] = useState<Message[]>(dummyMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setMessages(messages.map((msg) => (msg.id === message.id ? { ...msg, isRead: true } : msg)));
    setReplyText(''); // Clear reply text when new message is selected
  };

  const handleSendReply = () => {
    if (selectedMessage && replyText.trim() !== '') {
      console.log(`Replying to ${selectedMessage.sender}: ${replyText}`);
      // In a real app, send reply via API and update messages
      setReplyText('');
      setSelectedMessage(null); // Close message after sending
    }
  };

  const handleApplyQuickReply = (quickReply: QuickReply) => {
    setReplyText(quickReply.text);
  };

  const handleTranslate = (message: Message) => {
    console.log(`Translating message: "${message.content}"`);
    // In a real app, call a translation API
    alert(
      `Translation for "${message.content}" (dummy): "Hello, I want to know if there is a heated pool."`
    );
  };

  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">Unified Inbox with Sentiment AI</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1 bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">
            Inbox ({messages.filter((msg) => !msg.isRead).length} Unread)
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg cursor-pointer ${selectedMessage?.id === message.id ? 'bg-sky-500/10 border-sky-400' : 'bg-white/5 hover:bg-white/10'} ${message.isRead ? 'opacity-70' : 'font-semibold'}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white">{message.sender}</span>
                  <span className="text-xs text-white/50">
                    {new Date(message.timestamp).toLocaleTimeString()}
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
                  {message.propertyName && (
                    <span className="ml-2 text-xs text-white/50">({message.propertyName})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail & Reply */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          {selectedMessage ? (
            <>
              <div className="mb-4 pb-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">{selectedMessage.sender}</h2>
                <p className="text-sm text-zinc-400">{selectedMessage.propertyName}</p>
                <p className="text-xs text-white/50">
                  {new Date(selectedMessage.timestamp).toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs text-white ${getSentimentColor(selectedMessage.sentiment)}`}
                  >
                    <Sparkles size={12} className="inline-block mr-1" />
                    {selectedMessage.sentiment}
                  </span>
                  <button
                    onClick={() => handleTranslate(selectedMessage)}
                    className="ml-3 text-sky-400 hover:text-sky-200 text-sm flex items-center"
                  >
                    <Languages size={16} className="mr-1" /> Translate
                  </button>
                </div>
              </div>
              <p className="text-white mb-6">{selectedMessage.content}</p>

              <div className="mb-4">
                <h3 className="font-semibold text-white mb-2">Quick Replies:</h3>
                <div className="flex flex-wrap gap-2">
                  {dummyQuickReplies.map((qr) => (
                    <button
                      key={qr.id}
                      onClick={() => handleApplyQuickReply(qr)}
                      className="px-3 py-1 bg-white/5 text-zinc-400 rounded-full text-sm hover:bg-white/10 transition-colors"
                    >
                      <Lightbulb size={14} className="inline-block mr-1" /> {qr.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <textarea
                  className="w-full p-3 border border-white/10 rounded-lg mb-3 focus:ring-sky-500 focus:border-sky-500 text-white placeholder-zinc-400"
                  rows={4}
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
                <button
                  onClick={handleSendReply}
                  className="self-end px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center"
                >
                  <Send size={18} className="mr-2" /> Send Reply
                </button>
              </div>
            </>
          ) : (
            <p className="text-white/50">Select a message to view details and reply.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedInbox;
