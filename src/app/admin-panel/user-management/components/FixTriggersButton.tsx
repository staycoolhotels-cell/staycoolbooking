'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const FixTriggersButton = () => {
    const [loading, setLoading] = useState(false);

    const handleFix = async () => {
        setLoading(true);
        const toastId = toast.loading('Applying database fix...');

        try {
            const response = await fetch('/api/apply-trigger-fix');
            const data = await response.json();

            if (data.success) {
                toast.success('Database triggers fixed successfully!', { id: toastId });
            } else {
                console.error('Fix failed:', data);
                toast.error(data.message || 'Failed to apply fix. see console.', { id: toastId });
            }
        } catch (error) {
            console.error('Error applying fix:', error);
            toast.error('An error occurred while applying the fix.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleFix}
            disabled={loading}
            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
        >
            {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <ShieldAlert className="mr-2 h-4 w-4" />
            )}
            Fix Status Resets
        </Button>
    );
};

export default FixTriggersButton;
