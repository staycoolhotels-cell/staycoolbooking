'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { rejectHostWithReason } from '@/lib/admin-actions';
import { toast } from 'sonner';

interface RejectHostDialogProps {
    userId: string;
    userName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function RejectHostDialog({
    userId,
    userName,
    open,
    onOpenChange,
    onSuccess,
}: RejectHostDialogProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        setIsSubmitting(true);
        const { success, error } = await rejectHostWithReason(userId, reason.trim());

        if (error) {
            console.error('Error rejecting host:', error);
            toast.error('Failed to reject host.');
            setIsSubmitting(false);
            return;
        }

        if (success) {
            toast.success('Host rejected successfully.');
            setReason('');
            onSuccess();
            onOpenChange(false);
        }

        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Reject Host Application</DialogTitle>
                    <DialogDescription>
                        You are about to reject the host application for <strong>{userName}</strong>. Please provide a reason
                        that will be shown to the applicant.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Rejection Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., Incomplete documentation, Property does not meet our standards, etc."
                            value={reason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            This reason will be displayed to the host when they try to login.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setReason('');
                            onOpenChange(false);
                        }}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
                        {isSubmitting ? 'Rejecting...' : 'Reject Host'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
