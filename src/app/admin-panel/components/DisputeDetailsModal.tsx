import React, { useState } from 'react';
import { Dispute } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { sendAdminMessageToHost } from '@/lib/admin-actions';

interface DisputeDetailsModalProps {
    dispute: Dispute | null;
    onClose: () => void;
    onUpdateStatus: (id: string, newStatus: Dispute['status']) => Promise<void>;
}

const DisputeDetailsModal = ({ dispute, onClose, onUpdateStatus }: DisputeDetailsModalProps) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState('');

    if (!dispute) return null;

    const handleStatusChange = async (newStatus: Dispute['status']) => {
        setIsUpdating(true);
        await onUpdateStatus(dispute.id, newStatus);
        setIsUpdating(false);
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        setIsUpdating(true);
        
        const res = await sendAdminMessageToHost(dispute.id, message.trim());
        
        if (res.success) {
            toast.success(`Message sent to ${dispute.hostName}`);
            setMessage('');
        } else {
            toast.error(`Failed to send message: ${res.error}`);
        }
        
        setIsUpdating(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <div>
                        <h2 className="text-xl font-heading font-bold text-zinc-100 flex items-center gap-2">
                            <Icon name="ExclamationTriangleIcon" size={24} className="text-brand-default" />
                            Dispute Details
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">Case Number: {dispute.caseNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    >
                        <Icon name="XMarkIcon" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Current Status Banner */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                        <div>
                            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Current Status</span>
                            <div className="text-lg font-semibold text-zinc-200 mt-1">{dispute.status.replace('_', ' ').toUpperCase()}</div>
                        </div>
                        <div>
                            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Priority</span>
                            <div className="text-lg font-semibold text-zinc-200 mt-1 capitalize">{dispute.priority}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Guest</span>
                            <p className="font-heading font-medium text-zinc-200">{dispute.guestName}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Host</span>
                            <p className="font-heading font-medium text-brand-default">{dispute.hostName}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Property</span>
                            <p className="font-heading font-medium text-zinc-200 flex items-center gap-2">
                                <Icon name="HomeIcon" size={16} className="text-brand-deep" />
                                {dispute.propertyName}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Guest's Description</span>
                            <div className="bg-[#050505] border border-white/5 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed min-h-[80px]">
                                {dispute.description || <span className="text-zinc-600 italic">No description provided by the guest.</span>}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Host's Response</span>
                            <div className="bg-[#050505] border border-white/5 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed min-h-[80px]">
                                {dispute.host_response || <span className="text-zinc-600 italic">The host has not responded to this dispute yet.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-500 border-t border-white/10 pt-4">
                        <span>Created: {new Date(dispute.createdDate || '').toLocaleDateString()}</span>
                        <span>Last Updated: {new Date(dispute.lastUpdate || '').toLocaleDateString()}</span>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-zinc-300">Update Status</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleStatusChange('resolved')}
                                disabled={isUpdating || dispute.status === 'resolved'}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                                Mark Resolved
                            </button>
                            <button
                                onClick={() => handleStatusChange('closed')}
                                disabled={isUpdating || dispute.status === 'closed'}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50"
                            >
                                Close & Delete
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 my-1" />

                    <span className="text-sm font-semibold text-zinc-300">Message Host</span>

                    <div className="flex gap-3 items-center">
                        <input
                            type="text"
                            placeholder={`Type a message to ${dispute.hostName}...`}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isUpdating}
                            className="flex-1 bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-brand-default focus:ring-1 focus:ring-brand-default transition-all placeholder-zinc-600"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isUpdating || !message.trim()}
                            className="px-6 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-sky-500 text-white hover:bg-sky-600 flex items-center gap-2"
                        >
                            <Icon name="PaperAirplaneIcon" size={18} />
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisputeDetailsModal;
