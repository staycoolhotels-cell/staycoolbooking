'use server';

import { createClient, createServiceClient } from './supabase-server';

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

/**
 * Broadcasts a notification payload in real time over Supabase Realtime cluster.
 * Delivered to connected browsers in <50ms without DB polling lag.
 */
export async function broadcastRealtimeNotification(payload: {
  id?: string;
  type: string;
  title: string;
  message: string;
  status?: string;
  userId?: string | null;
  targetRole?: 'guest' | 'host' | 'admin' | null;
  url?: string;
}) {
  try {
    const supabase = createServiceClient();
    const channel = supabase.channel('staycool-global-alerts');
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        try { supabase.removeChannel(channel); } catch {}
        resolve();
      }, 2000);

      channel.subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'new_notification',
            payload
          }).then(() => {
            clearTimeout(timeout);
            setTimeout(() => {
              try { supabase.removeChannel(channel); } catch {}
            }, 500);
            resolve();
          }).catch((sendErr) => {
            clearTimeout(timeout);
            console.warn('[broadcastRealtimeNotification] Send error:', sendErr);
            try { supabase.removeChannel(channel); } catch {}
            resolve();
          });
        }
      });
    });
  } catch (err) {
    console.warn('[broadcastRealtimeNotification] Unexpected broadcast error:', err);
  }
}

/**
 * Inserts a persistent notification in the database AND broadcasts it to the recipient's browser.
 */
export const createNotification = async (
  type: string,
  title: string,
  message: string,
  status: 'info' | 'success' | 'error' | 'warning' = 'info',
  userId?: string | null,
  targetRole?: 'guest' | 'host' | 'admin' | null,
  targetUrl?: string
) => {
  let createdData: any = null;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        type,
        title,
        message,
        status,
        user_id: userId || null,
        is_read: false
      }])
      .select();

    if (error) {
      console.error('Error creating notification in DB:', error);
    } else {
      createdData = data;
    }
  } catch (dbErr) {
    console.error('DB notification insert error:', dbErr);
  }

  // Determine target navigation URL
  const resolvedUrl = targetUrl || getDefaultNotificationUrl(type, targetRole);

  // Broadcast in real-time over WebSocket
  await broadcastRealtimeNotification({
    id: createdData?.[0]?.id || `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    title,
    message,
    status,
    userId: userId || null,
    targetRole: targetRole || null,
    url: resolvedUrl,
  });

  return createdData;
};

/**
 * Named helper for targeted notifications across Guest, Host, and Admin roles.
 */
export const sendTargetedNotification = async (opts: {
  type: string;
  title: string;
  message: string;
  status?: 'info' | 'success' | 'error' | 'warning';
  userId?: string | null;
  targetRole?: 'guest' | 'host' | 'admin' | null;
  url?: string;
}) => {
  return createNotification(
    opts.type,
    opts.title,
    opts.message,
    opts.status || 'info',
    opts.userId || null,
    opts.targetRole || null,
    opts.url
  );
};

// Helper function to generate default navigation URLs
function getDefaultNotificationUrl(type: string, targetRole?: string | null): string {
  if (targetRole === 'admin') return '/admin-panel';
  if (targetRole === 'host') return '/host-dashboard';
  if (targetRole === 'guest') return '/user-profile';

  switch (type) {
    case 'booking':
      return '/user-profile';
    case 'payout':
    case 'new_property':
    case 'host_approval':
      return '/host-dashboard';
    case 'dispute':
    case 'admin':
      return '/admin-panel';
    default:
      return '/';
  }
}

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
