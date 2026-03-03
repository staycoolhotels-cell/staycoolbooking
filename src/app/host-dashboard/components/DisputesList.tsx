'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Dispute } from '@/lib/types';
import { respondToDispute } from '@/lib/dispute-actions';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface DisputesListProps {
    disputes: Dispute[];
    isLoading?: boolean;
}

const DisputesList = ({ disputes, isLoading }: DisputesListProps) => {
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (disputes.length === 0) {
        return (
            <div className="text-center p-12 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                <Icon name="ScaleIcon" size={48} className="mx-auto text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Active Disputes</h3>
                <p className="text-sm text-white/40">You don't have any open disputes at the moment. Keep providing great service!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {disputes.map((dispute, index) => (
                <motion.div
                    key={dispute.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/10 p-6 hover:border-primary/30 transition-all group"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${dispute.priority === 'critical' ? 'bg-red-500/10 text-red-500' :
                                dispute.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                                    'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                <Icon name="ScaleIcon" size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">
                                        {dispute.caseNumber}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${dispute.status === 'open' ? 'bg-sky-500/10 text-sky-400' :
                                        dispute.status === 'resolved' ? 'bg-success/10 text-success' :
                                            'bg-white/10 text-white/40'
                                        }`}>
                                        {dispute.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-sm text-white/60 mb-1">{dispute.propertyName}</p>
                                <p className="text-xs text-white/40">Filed by: {dispute.guestName}</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-2 text-sm">
                            <span className={`font-black uppercase text-[10px] ${dispute.priority === 'critical' ? 'text-red-500' :
                                dispute.priority === 'high' ? 'text-orange-500' :
                                    'text-yellow-500'
                                }`}>
                                {dispute.priority} Priority
                            </span>
                            <p className="text-white/40">Updated: {new Date(dispute.lastUpdate || dispute.createdDate).toLocaleDateString()}</p>
                            <button
                                onClick={() => {
                                    setSelectedDispute(dispute);
                                    const hostResponse = (dispute.description || '').split(' ||| ')[1] || dispute.host_response || '';
                                    setResponseMessage(hostResponse);
                                }}
                                className="mt-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
                            >
                                View Details & Respond
                            </button>
                        </div>
                    </div>

                    {dispute.description && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-sm text-white/50 italic line-clamp-2">
                                "{dispute.description.split(' ||| ')[0]}"
                            </p>
                        </div>
                    )}
                </motion.div>
            ))}

            <AnimatePresence>
                {selectedDispute && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-3xl overflow-hidden relative"
                        >
                            <button
                                onClick={() => setSelectedDispute(null)}
                                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-zinc-500 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className={`p-4 rounded-2xl ${selectedDispute.priority === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    <Icon name="ScaleIcon" size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{selectedDispute.caseNumber}</h3>
                                    <p className="text-sm text-white/40">{selectedDispute.propertyName} • {selectedDispute.issueType}</p>
                                </div>
                                <span className="px-3 py-1 bg-sky-500/10 text-sky-400 rounded-full text-xs font-black uppercase tracking-widest">
                                    {selectedDispute.status}
                                </span>
                            </div>

                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Guest Statement</p>
                                    <p className="text-white/70 leading-relaxed italic">
                                        "{(selectedDispute.description || '').split(' ||| ')[0] || 'No description provided.'}"
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                                        <span className="text-white/40">Filed by: <b className="text-white/60">{selectedDispute.guestName}</b></span>
                                        <span className="text-white/40">{new Date(selectedDispute.createdDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Your Response</p>
                                    <textarea
                                        value={responseMessage}
                                        onChange={(e) => setResponseMessage(e.target.value)}
                                        placeholder="Address the issue or clarify details..."
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-sky-500/50 transition-colors min-h-[120px]"
                                    />

                                    <div className="flex flex-wrap gap-3">
                                        {(['in_progress', 'resolved', 'closed'] as const).map((status) => {
                                            const isThisStatusSubmitting = isSubmitting && responseMessage === status; // Simplified check
                                            return (
                                                <button
                                                    key={status}
                                                    onClick={async () => {
                                                        const existingHostResponse = (selectedDispute.description || '').split(' ||| ')[1] || selectedDispute.host_response || '';
                                                        const finalResponse = responseMessage.trim() || existingHostResponse;
                                                        if (!finalResponse && (status === 'resolved' || status === 'closed')) {
                                                            toast.error(`Please provide a response before marking as ${status.replace('_', ' ')}.`);
                                                            return;
                                                        }
                                                        setIsSubmitting(true);
                                                        try {
                                                            const res = await respondToDispute(selectedDispute.id, finalResponse, status);
                                                            if (res.success) {
                                                                toast.success(`Dispute updated to ${status.replace('_', ' ')}`);
                                                                setTimeout(() => {
                                                                    setSelectedDispute(null);
                                                                    setResponseMessage('');
                                                                    window.location.reload();
                                                                }, 1000);
                                                            } else {
                                                                toast.error("Failed to update: " + res.error);
                                                            }
                                                        } catch (err) {
                                                            toast.error("An unexpected error occurred.");
                                                            console.error(err);
                                                        } finally {
                                                            setIsSubmitting(false);
                                                        }
                                                    }}
                                                    disabled={isSubmitting}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${status === 'resolved' ? 'bg-success/20 text-success border border-success/20 hover:bg-success/30' :
                                                        status === 'in_progress' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20 hover:bg-sky-500/30' :
                                                            'bg-white/10 text-white/40 border border-white/10 hover:bg-white/20'
                                                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isSubmitting ? 'Updating...' : status.replace('_', ' ')}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DisputesList;
