'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Dispute } from '@/lib/types';
import { respondToDispute, deleteDispute } from '@/lib/dispute-actions';
import { toast } from 'sonner';
import ActionConfirmModal from '@/components/ui/ActionConfirmModal';


interface DisputesListProps {
    disputes: Dispute[];
    isLoading?: boolean;
}

const getPriorityStyle = (priority: string) => {
    switch (priority) {
        case 'critical':
            return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: 'text-red-500', glow: 'shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]' };
        case 'high':
            return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: 'text-orange-500', glow: 'shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]' };
        case 'medium':
        default:
            return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: 'text-yellow-500', glow: '' };
    }
};

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'resolved':
        case 'closed':
            return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
        case 'in_progress':
            return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
        case 'open':
        default:
            return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' };
    }
};

const DisputesList = ({ disputes, isLoading }: DisputesListProps) => {
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [disputeToDelete, setDisputeToDelete] = useState<string | null>(null);


    // Keep selectedDispute synced with real-time updates from parent
    React.useEffect(() => {
        if (selectedDispute) {
            const updated = disputes.find(d => d.id === selectedDispute.id);
            if (updated && updated.lastUpdate !== selectedDispute.lastUpdate) {
                setSelectedDispute(updated);
            }
        }
    }, [disputes, selectedDispute]);

    if (isLoading) {
        return (
            <div className="w-full h-[400px] flex flex-col items-center justify-center p-8">
                <Icon name="ArrowPathIcon" size={40} className="text-indigo-500 animate-spin mb-4" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Loading Resolution Center...</p>
            </div>
        );
    }

    if (disputes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0a0a0f]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-12 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative z-10">
                    <Icon name="ShieldCheckIcon" size={48} className="text-emerald-400 drop-shadow-md" />
                </div>

                <h3 className="text-2xl font-heading font-black text-white mb-2 relative z-10 tracking-tight">Zero Active Conflicts</h3>
                <p className="text-sm font-medium text-zinc-400 max-w-md relative z-10 leading-relaxed">
                    Your operations are running flawlessly. There are currently no open disputes requiring your attention or mediation.
                </p>
                <div className="mt-8 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-500 uppercase tracking-widest relative z-10 shadow-inner">
                    Systems Optimal
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative z-10">
            {/* Header Stats Strip */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-inner">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Icon name="ScaleIcon" size={16} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Cases</p>
                        <p className="text-xl font-heading font-black text-white leading-none">{disputes.length}</p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-inner">
                    <div className="p-2 bg-red-500/20 rounded-xl">
                        <Icon name="ExclamationTriangleIcon" size={16} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Action Req.</p>
                        <p className="text-xl font-heading font-black text-white leading-none">
                            {disputes.filter(d => d.status === 'open' || d.status === 'in_progress').length}
                        </p>
                    </div>
                </div>
            </div>

            {disputes.map((dispute, index) => {
                const isClosed = dispute.status === 'resolved' || dispute.status === 'closed';
                const priorityStyle = getPriorityStyle(dispute.priority);
                const statusStyle = getStatusStyle(dispute.status);

                return (
                    <motion.div
                        key={dispute.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-[2rem] border transition-all duration-300 relative overflow-hidden group 
                           ${isClosed
                                ? 'bg-black/40 border-white/5 opacity-80'
                                : `bg-[#0a0a0f]/80 backdrop-blur-xl border-white/10 hover:border-indigo-500/30 ${priorityStyle.glow}`
                            }`}
                    >
                        {isClosed && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}
                        {!isClosed && <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />}

                        <div className="p-6 md:p-8 relative z-10 flex flex-col lg:flex-row gap-6 lg:items-center justify-between">

                            {/* Left Side: Icon & Titles */}
                            <div className="flex items-start gap-5 flex-1 min-w-0">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-colors
                                    ${isClosed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : `${priorityStyle.bg} ${priorityStyle.border} ${priorityStyle.icon}`}
                                `}>
                                    <Icon name={isClosed ? "CheckBadgeIcon" : "ExclamationCircleIcon"} size={28} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                        <h4 className={`text-xl font-heading font-black tracking-tight truncate transition-colors ${isClosed ? 'text-zinc-300' : 'text-white group-hover:text-indigo-400'}`}>
                                            Case {dispute.caseNumber}
                                        </h4>
                                        <div className="flex gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border shadow-inner ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                {dispute.status.replace('_', ' ')}
                                            </span>
                                            {!isClosed && (
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border shadow-inner ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
                                                    Priority: {dispute.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm font-bold text-zinc-400 truncate mb-1">
                                        {dispute.propertyName}
                                        {dispute.issueType && <span className="text-zinc-600 font-normal"> • {dispute.issueType.replace('_', ' ')}</span>}
                                    </p>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
                                        <p className="text-zinc-500 truncate"><span className="text-zinc-600 mr-1">Filed by:</span> <span className="text-zinc-300 font-medium">{dispute.guestName}</span></p>
                                        <p className="text-zinc-500 hidden sm:block">•</p>
                                        <p className="text-zinc-500"><span className="text-zinc-600 mr-1">Updated:</span> {new Date(dispute.lastUpdate || dispute.createdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Actions & Mini-snippet */}
                            <div className="flex flex-col lg:items-end gap-4 shrink-0 border-t border-white/5 lg:border-t-0 pt-4 lg:pt-0">
                                {dispute.description && (
                                    <div className="lg:max-w-xs xl:max-w-sm rounded-xl bg-white/5 border border-white/10 p-3 shadow-inner">
                                        <p className="text-xs text-zinc-400 italic line-clamp-2 leading-relaxed">
                                            "{dispute.description.split(' ||| ')[0]}"
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    {isClosed && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDisputeToDelete(dispute.id);
                                            }}

                                            className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all shrink-0"
                                            title="Delete Case"
                                        >
                                            <Icon name="TrashIcon" size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSelectedDispute(dispute);
                                            const hostResponse = (dispute.description || '').split(' ||| ')[1] || dispute.host_response || '';
                                            setResponseMessage(hostResponse);
                                        }}
                                        className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 flex-1 lg:flex-none
                                            ${isClosed
                                                ? 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]'
                                            }`}
                                    >
                                        {isClosed ? 'Review Case' : 'Resolve Conflict'}
                                        <Icon name={isClosed ? "MagnifyingGlassIcon" : "ArrowRightIcon"} size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}

            {/* Resolution Center Modal */}
            <AnimatePresence>
                {selectedDispute && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#0a0a0f] rounded-[2.5rem] w-full max-w-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative my-auto flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header Strip */}
                            <div className={`h-1.5 w-full ${selectedDispute.status === 'resolved' || selectedDispute.status === 'closed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600'}`} />

                            <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 relative bg-white/[0.02]">
                                <div className="absolute top-0 left-0 w-64 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />

                                <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border
                                        ${selectedDispute.status === 'resolved' || selectedDispute.status === 'closed'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                        }`}
                                    >
                                        <Icon name={selectedDispute.status === 'resolved' || selectedDispute.status === 'closed' ? "CheckShieldIcon" : "ScaleIcon"} size={28} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-2xl font-heading font-black text-white tracking-tight truncate">Case {selectedDispute.caseNumber}</h3>
                                            <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg border shadow-inner shrink-0
                                                ${getStatusStyle(selectedDispute.status).bg} ${getStatusStyle(selectedDispute.status).text} ${getStatusStyle(selectedDispute.status).border}
                                            `}>
                                                {selectedDispute.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-zinc-400 truncate">
                                            {selectedDispute.propertyName}
                                            {selectedDispute.issueType && <span className="text-zinc-600"> • {selectedDispute.issueType.replace('_', ' ')}</span>}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedDispute(null)}
                                    className="absolute md:relative top-6 md:top-auto right-6 md:right-auto w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors z-20 shrink-0"
                                >
                                    <Icon name="XMarkIcon" size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 relative">

                                {/* Timeline / Context Area */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">

                                    {/* Guest Statement */}
                                    <div className="rounded-[1.5rem] bg-zinc-900 border border-white/5 p-6 relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />
                                        <div className="flex items-center gap-2 mb-4">
                                            <Icon name="ChatBubbleLeftEllipsisIcon" size={18} className="text-zinc-500" />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Guest Statement</h4>
                                        </div>

                                        <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 mb-4 shadow-inner">
                                            <p className="text-sm text-zinc-300 leading-relaxed italic">
                                                "{(selectedDispute.description || '').split(' ||| ')[0] || 'No description provided.'}"
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center text-xs mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                                                    <Icon name="UserIcon" size={12} className="text-zinc-400" />
                                                </div>
                                                <span className="font-bold text-white">{selectedDispute.guestName}</span>
                                            </div>
                                            <span className="text-zinc-500 font-medium">Filed: {new Date(selectedDispute.createdDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                    </div>

                                    {/* Case Meta */}
                                    <div className="rounded-[1.5rem] bg-zinc-900 border border-white/5 p-6 flex flex-col gap-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon name="InformationCircleIcon" size={18} className="text-zinc-500" />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Case Intel</h4>
                                        </div>

                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 shadow-inner flex flex-col gap-3 flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Priority Rating</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getPriorityStyle(selectedDispute.priority).text} ${getPriorityStyle(selectedDispute.priority).border}`}>
                                                    {selectedDispute.priority}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Est. Amount</span>
                                                <span className="text-sm font-bold text-white tracking-widest font-mono">
                                                    ₹{selectedDispute.amount?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Last Activity</span>
                                                <span className="text-xs text-zinc-300">
                                                    {new Date(selectedDispute.lastUpdate || selectedDispute.createdDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Messages Area */}
                                {(() => {
                                    const allParts = (selectedDispute.description || '').split(' ||| ');
                                    const adminMsgs = allParts.slice(2).filter(p => p.startsWith('ADMIN_MSG: ')).map(p => p.replace('ADMIN_MSG: ', ''));
                                    
                                    if (adminMsgs.length === 0) return null;
                                    
                                    return (
                                        <div className="relative z-10 w-full mb-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Icon name="ChatBubbleOvalLeftEllipsisIcon" size={18} className="text-sky-400" />
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-sky-400">Messages from Support</h4>
                                            </div>
                                            <div className="space-y-3">
                                                {adminMsgs.map((msg, i) => (
                                                    <div key={i} className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex gap-3 shadow-inner">
                                                        <Icon name="ShieldCheckIcon" size={20} className="text-sky-400 shrink-0 mt-0.5" />
                                                        <p className="text-sm text-sky-100">{msg}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Host Response Area */}
                                <div className="relative z-10 w-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Icon name="PencilSquareIcon" size={18} className="text-indigo-400" />
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Official Resolution Response</h4>
                                    </div>
                                    <textarea
                                        value={responseMessage}
                                        onChange={(e) => setResponseMessage(e.target.value)}
                                        placeholder="Draft your formal response, clarify details, or propose a resolution..."
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-[1.5rem] p-5 md:p-6 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all min-h-[160px] shadow-inner resize-none leading-relaxed"
                                        disabled={selectedDispute.status === 'closed' || selectedDispute.status === 'resolved'}
                                    />
                                </div>

                            </div>

                            {/* Modal Footer / Actions */}
                            {selectedDispute.status !== 'closed' && selectedDispute.status !== 'resolved' && (
                                <div className="p-6 md:p-8 bg-black/40 border-t border-white/5 mt-auto relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 text-center">Update Case Status</p>
                                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 max-w-2xl mx-auto">
                                        {(['in_progress', 'resolved'] as const).map((status) => {
                                            const isResolving = status === 'resolved';

                                            // Provide specific icons based on status map
                                            let iconMap = "ArrowPathIcon";
                                            if (isResolving) iconMap = "CheckBadgeIcon";

                                            return (
                                                <button
                                                    key={status}
                                                    onClick={async () => {
                                                        const existingHostResponse = (selectedDispute.description || '').split(' ||| ')[1] || selectedDispute.host_response || '';
                                                        const finalResponse = responseMessage.trim() || existingHostResponse;
                                                        if (!finalResponse && status === 'resolved') {
                                                            toast.error(`Please provide a response before marking as resolved.`);
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
                                                                    window.location.reload(); // Simple refresh for now
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
                                                    className={`flex-1 min-w-[140px] px-4 py-4 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2
                                                        ${isResolving
                                                            ? 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                                                            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300'}
                                                        ${isSubmitting ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:-translate-y-0.5'}
                                                    `}
                                                >
                                                    {isSubmitting ? (
                                                        <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Icon name={iconMap} size={16} />
                                                            Mark as {status.replace('_', ' ')}
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })}

                                        {/* Separate Close action using a slightly different style */}
                                        <button
                                            onClick={async () => {
                                                const existingHostResponse = (selectedDispute.description || '').split(' ||| ')[1] || selectedDispute.host_response || '';
                                                const finalResponse = responseMessage.trim() || existingHostResponse;
                                                if (!finalResponse) {
                                                    toast.error(`Please provide a response before closing the case.`);
                                                    return;
                                                }
                                                setIsSubmitting(true);
                                                try {
                                                    const res = await respondToDispute(selectedDispute.id, finalResponse, 'closed');
                                                    if (res.success) {
                                                        toast.success(`Case officially closed.`);
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
                                                } finally {
                                                    setIsSubmitting(false);
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto px-6 py-4 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-0"
                                        >
                                            <Icon name="ArchiveBoxXMarkIcon" size={16} /> Force Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ActionConfirmModal
                isOpen={!!disputeToDelete}
                onClose={() => setDisputeToDelete(null)}
                onConfirm={async () => {
                    const id = disputeToDelete;
                    setDisputeToDelete(null);
                    if (!id) return;
                    
                    try {
                        const res = await deleteDispute(id);
                        if (res.success) {
                            toast.success('Case deleted successfully.');
                            window.location.reload();
                        } else {
                            toast.error('Failed to delete case: ' + res.error);
                        }
                    } catch (err) {
                        toast.error('An unexpected error occurred.');
                    }
                }}
                title="Delete Dispute Case?"
                description="Are you sure you want to delete this case? This action is permanent and will remove all associated logs."
                confirmLabel="Delete Case"
                variant="danger"
            />
        </div>

    );
};

export default DisputesList;
