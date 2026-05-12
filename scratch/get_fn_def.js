const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getFunctionDefinition() {
  const { data, error } = await supabase.rpc('get_function_definition', {
    function_name: 'get_rooms_realtime_status'
  });
  
  if (error) {
    // If get_function_definition doesn't exist, try raw sql via a known execute method or information_schema
    console.error('Error fetching definition via RPC:', error);
    
    // Attempt to use information_schema directly if possible (though select from information_schema might be restricted)
    // Actually, I can't easily run arbitrary SQL unless there's an 'exec' RPC.
  } else {
    console.log('Function Definition:', data);
  }
}

getFunctionDefinition();
