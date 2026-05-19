-- Add missing columns to activities table for proper recent activity display
-- This fixes the sync issue in the admin dashboard

-- Add title column
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS title text;

-- Add status column with default value
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'info';

-- Update existing records with appropriate default values based on type
UPDATE public.activities 
SET title = CASE 
    WHEN type = 'verification' THEN 'Verification Request'
    WHEN type = 'booking' THEN 'New Booking'
    WHEN type = 'dispute' THEN 'Dispute Filed'
    WHEN type = 'payout' THEN 'Payout Processed'
    WHEN type = 'user_action' THEN 'User Action'
    WHEN type = 'property_review' THEN 'Property Review'
    WHEN type = 'host_approval' THEN 'Host Approval'
    ELSE 'Activity'
END
WHERE title IS NULL;

-- Update status based on description keywords
UPDATE public.activities 
SET status = CASE 
    WHEN description ILIKE '%approved%' OR description ILIKE '%success%' THEN 'success'
    WHEN description ILIKE '%rejected%' OR description ILIKE '%failed%' THEN 'error'
    WHEN description ILIKE '%pending%' OR description ILIKE '%waiting%' THEN 'warning'
    ELSE 'info'
END
WHERE status = 'info';

-- Verify the changes
SELECT 'Activities table updated successfully!' as message;
SELECT COUNT(*) as total_activities FROM public.activities;
