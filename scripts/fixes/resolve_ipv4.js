const dns = require('dns');

dns.resolve4('db.dlislsrlwovcxsuqdlvy.supabase.co', (err, addresses) => {
  if (err) {
    console.error(err);
  } else {
    console.log('IPv4 addresses:', addresses);
  }
});

