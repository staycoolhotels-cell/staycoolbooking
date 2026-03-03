
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProperties() {
    let output = 'Checking all properties permissions...\n';

    // 1. Get counts by status
    const { data: allProperties, error } = await supabase
        .from('properties')
        .select('id, title, status');

    if (error) {
        output += `Error fetching properties: ${JSON.stringify(error)}\n`;
        fs.writeFileSync('scripts/db_status_output.txt', output);
        return;
    }

    output += `Total properties found: ${allProperties.length}\n`;

    const statusCounts = allProperties.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    output += `Property counts by status: ${JSON.stringify(statusCounts)}\n`;

    // 2. Check specifically for 'active' properties
    const { data: activeProperties, error: activeError } = await supabase
        .from('properties')
        .select('id, title, status')
        .eq('status', 'active');

    if (activeError) {
        output += `Error fetching active properties: ${JSON.stringify(activeError)}\n`;
    } else {
        output += `Active properties found via query: ${activeProperties.length}\n`;
    }

    // 3. Check for 'pending' properties
    const { data: pendingProperties, error: pendingError } = await supabase
        .from('properties')
        .select('id, title, status')
        .eq('status', 'pending');

    if (pendingError) {
        output += `Error fetching pending properties: ${JSON.stringify(pendingError)}\n`;
    } else {
        output += `Pending properties found via query: ${pendingProperties.length}\n`;
    }

    fs.writeFileSync('scripts/db_status_output.txt', output);
    console.log('Done writing to file.');
}

checkProperties();
