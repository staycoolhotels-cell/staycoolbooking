import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
    const caseNumber = `DPT-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
    console.log('Attempting insert into disputes...');

    const { data, error } = await supabase
        .from('disputes')
        .insert([
            {
                caseNumber,
                guestName: 'Test Guest',
                hostName: 'Test Host',
                propertyName: 'Test Property',
                issueType: 'Test Issue',
                priority: 'low',
                status: 'open',
                createdDate: new Date().toISOString(),
                lastUpdate: new Date().toISOString(),
                booking_id: '8177a311-486b-42e1-9aca-65198affb71f',
                guest_id: '8177a311-486b-42e1-9aca-65198affb71f',
                host_id: '8177a311-486b-42e1-9aca-65198affb71f',
                property_id: '8177a311-486b-42e1-9aca-65198affb71f',
                description: 'Test Description',
            },
        ]);

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success:', data);
    }
}

testInsert();
