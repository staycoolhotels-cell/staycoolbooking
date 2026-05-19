const fs = require('fs');
let content = fs.readFileSync('SUPABASE_APPLY_ME.sql', 'utf8');
content = content.replace(
    "FOR prop IN SELECT id, name FROM public.properties WHERE NOT EXISTS",
    "FOR prop IN SELECT id FROM public.properties WHERE NOT EXISTS"
);
fs.writeFileSync('supabase/migrations/20261231235959_final_fix.sql', content);
console.log('Fixed syntax error in migration script!');
