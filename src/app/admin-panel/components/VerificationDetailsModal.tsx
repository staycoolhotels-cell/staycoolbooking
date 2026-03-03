import React from 'react';
import { VerificationItem } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface VerificationDetailsModalProps {
    item: VerificationItem | null;
    onClose: () => void;
    onReview: (id: string, action: 'approved' | 'rejected') => void;
}

const VerificationDetailsModal = ({ item, onClose, onReview }: VerificationDetailsModalProps) => {
    if (!item) return null;

    const priorityColors: Record<string, string> = {
        high: 'bg-error/10 text-error',
        medium: 'bg-warning/10 text-warning',
        low: 'bg-success/10 text-success',
    };

    const statusColors: Record<string, string> = {
        pending: 'bg-warning/10 text-warning',
        under_review: 'bg-primary/10 text-primary',
        approved: 'bg-success/10 text-success',
        rejected: 'bg-error/10 text-error',
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0a0a0f] z-10">
                    <div>
                        <h2 className="text-xl font-heading font-bold text-zinc-100">Verification Details</h2>
                        <p className="text-sm text-zinc-400">Review submitted documents</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    >
                        <Icon name="XMarkIcon" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 flex-1 overflow-y-auto">

                    {/* User Info Section */}
                    <div className="flex items-start space-x-4">
                        <AppImage
                            src={item.profileImage}
                            alt={item.profileImageAlt}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                        />
                        <div className="flex-1 space-y-1">
                            <h3 className="text-lg font-heading font-semibold text-zinc-100">{item.name}</h3>
                            <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-zinc-400 capitalize border border-white/5">
                                    {item.type} Account
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border border-white/5 ${priorityColors[item.priority || 'low']}`}>
                                    {(item.priority || 'low').toUpperCase()} Priority
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 pt-4 border-t border-white/5">
                                <div>
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Submitted</span>
                                    <p className="text-zinc-300 text-sm">{item.submittedDate}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Document Type</span>
                                    <p className="text-zinc-300 text-sm">{item.documentType}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wide ${statusColors[item.status] || 'bg-zinc-800 text-zinc-400'}`}>
                                {item.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Document Preview Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-heading font-semibold text-zinc-300 border-b border-white/10 pb-2">Submitted Document</h4>

                        {/* Document Placeholder / Image */}
                        <div className="bg-black/40 rounded-lg p-8 flex flex-col items-center justify-center border border-white/10 min-h-[300px] gap-4">
                            <Icon name="DocumentTextIcon" size={64} className="text-zinc-700" />
                            <div className="text-center space-y-1">
                                <p className="text-zinc-400 font-medium">Document Preview</p>
                                <p className="text-zinc-600 text-xs max-w-xs">
                                    This is a placeholder for the actual document image or PDF viewer.
                                    In a production environment, this would render the file from storage.
                                </p>
                            </div>
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-brand-primary text-sm font-medium rounded-lg transition-colors mt-2 flex items-center gap-2">
                                <Icon name="ArrowDownTrayIcon" size={16} />
                                Download Original File
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-[#0a0a0f] flex items-center justify-end space-x-3 sticky bottom-0 z-10 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-zinc-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <button
                        onClick={() => {
                            onReview(item.id, 'rejected');
                            onClose();
                        }}
                        className="px-4 py-2 bg-error/10 text-error border border-error/20 rounded-lg font-heading font-semibold hover:bg-error/20 transition-all duration-300 flex items-center space-x-2"
                    >
                        <Icon name="XCircleIcon" size={18} />
                        <span>Reject</span>
                    </button>
                    <button
                        onClick={() => {
                            onReview(item.id, 'approved');
                            onClose();
                        }}
                        className="px-6 py-2 bg-success text-success-primary text-white rounded-lg font-heading font-semibold hover:bg-success/90 shadow-lg shadow-success/10 transition-all duration-300 flex items-center space-x-2"
                    >
                        <Icon name="CheckCircleIcon" size={18} />
                        <span>Approve</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default VerificationDetailsModal;
