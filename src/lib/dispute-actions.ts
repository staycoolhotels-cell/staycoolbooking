'use server';

import { createClient } from './supabase-server';
import { logActivity } from './activity-actions';

export async function createDispute(data: {
    booking_id: string;
    guest_id: string;
    host_id: string;
    property_id: string;
    guestName: string;
    hostName: string;
    propertyName: string;
    issueType: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}) {
    const supabase = await createClient();
    const caseNumber = `DPT-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;

    const { data: dispute, error } = await supabase
        .from('disputes')
        .insert([
            {
                caseNumber,
                guestName: data.guestName,
                hostName: data.hostName,
                propertyName: data.propertyName,
                issueType: data.issueType,
                priority: data.priority,
                status: 'open',
                createdDate: new Date().toISOString(),
                lastUpdate: new Date().toISOString(),
                booking_id: data.booking_id,
                guest_id: data.guest_id,
                host_id: data.host_id,
                property_id: data.property_id,
                description: data.description,
            },
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating dispute:', error);
        return { success: false, error: error.message };
    }

    // Log activity
    await logActivity(
        'dispute',
        `New dispute filed for ${data.propertyName} by ${data.guestName}`,
        data.guest_id,
        'Dispute Filed',
        'warning'
    );

    return { success: true, data: dispute };
}

export async function respondToDispute(disputeId: string, response: string, newStatus: 'in_progress' | 'resolved' | 'closed' = 'in_progress') {
    const supabase = await createClient();

    const { data: currentDispute, error: fetchError } = await supabase
        .from('disputes')
        .select('description')
        .eq('id', disputeId)
        .single();

    if (fetchError || !currentDispute) {
        return { success: false, error: 'Dispute not found or database error' };
    }

    const guestStatement = (currentDispute.description || '').split(' ||| ')[0];
    const newDescription = `${guestStatement} ||| ${response}`;

    const { data: dispute, error } = await supabase
        .from('disputes')
        .update({
            status: newStatus,
            "lastUpdate": new Date().toISOString(),
            description: newDescription,
        })
        .eq('id', disputeId)
        .select()
        .single();

    if (error) {
        console.error('Error responding to dispute:', error);
        return { success: false, error: error.message || 'Unknown database error' };
    }

    if (!dispute) {
        return { success: false, error: 'Dispute not found' };
    }

    // Log activity
    try {
        await logActivity(
            'dispute',
            `Host responded to dispute ${dispute.caseNumber}. Status updated to ${newStatus}.`,
            dispute.host_id,
            'Dispute Response',
            'info'
        );
    } catch (logError) {
        console.error('Error logging activity but update succeeded:', logError);
    }

    return { success: true, data: dispute };
}
