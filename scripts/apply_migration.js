const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const sql = `
    ALTER TABLE public.properties 
    ADD COLUMN IF NOT EXISTS standard_price INTEGER;

    UPDATE public.properties 
    SET standard_price = price_per_night 
    WHERE standard_price IS NULL;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error applying migration via exec_sql:', error);
    console.log('Trying direct update if exec_sql is not available...');
    
    // Fallback: try to just add the column if exec_sql isn't available
    // But usually you can't run DDL via normal from().update()
    console.log('Please apply the migration manually in Supabase SQL Editor:');
    console.log(sql);
  } else {
    console.log('Migration applied successfully!');
  }
}

run();
