'use server';

import { createClient } from './supabase-server';

export const logActivity = async (
  type: string,
  description: string,
  userId?: string,
  title?: string,
  status: 'info' | 'success' | 'error' | 'warning' = 'info'
) => {
  const supabase = await createClient();
  // Generate a default title if not provided
  const activityTitle = title || generateDefaultTitle(type);

  const { data, error } = await supabase
    .from('activities')
    .insert([{
      type,
      description,
      user_id: userId,
      title: activityTitle,
      status
    }])
    .select();

  if (error) {
    console.error('Error logging activity:', error);
  }

  return data;
};

export const createNotification = async (
  type: string,
  title: string,
  message: string,
  status: 'info' | 'success' | 'error' | 'warning' = 'info',
  userId?: string
) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      type,
      title,
      message,
      status,
      user_id: userId,
      is_read: false
    }])
    .select();

  if (error) {
    console.error('Error creating notification:', error);
  }

  return data;
};

// Helper function to generate default titles based on activity type
function generateDefaultTitle(type: string): string {
  const titleMap: Record<string, string> = {
    'verification': 'Verification Request',
    'booking': 'New Booking',
    'dispute': 'Dispute Filed',
    'payout': 'Payout Processed',
    'user_action': 'User Action',
    'property_review': 'Property Review',
    'host_approval': 'Host Approval',
  };

  return titleMap[type] || 'Activity';
}
